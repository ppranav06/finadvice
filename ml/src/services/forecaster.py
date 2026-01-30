"""
Prophet-based Cash Flow Forecaster

Uses Facebook Prophet to forecast future cash flow based on historical
transaction data. Generates predictions with confidence intervals.
"""

from datetime import datetime, timedelta
from typing import Optional
import warnings
import os

import pandas as pd
import numpy as np

# Suppress Prophet's verbose logging and cmdstan warnings
warnings.filterwarnings('ignore', category=FutureWarning)
os.environ['CMDSTAN_VERBOSE'] = 'FALSE'

from ..database import get_supabase
from ..config import get_settings
from ..models import ForecastPoint, ForecastResult


def get_prophet_model():
    """
    Create and return a Prophet model instance.
    Handles potential import/initialization issues.
    """
    try:
        from prophet import Prophet
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
            interval_width=0.8
        )
        return model
    except Exception as e:
        print(f"Prophet initialization error: {e}")
        return None


def get_daily_cash_flow(user_id: str, months: int = 12) -> pd.DataFrame:
    """
    Aggregate transactions into daily cash flow.
    Returns DataFrame with columns: ds (date), y (net cash flow)
    """
    supabase = get_supabase()
    
    cutoff_date = datetime.now() - timedelta(days=months * 30)
    
    response = supabase.table('transactions').select(
        'txn_date, amount, type'
    ).eq('user_id', user_id).gte(
        'txn_date', cutoff_date.isoformat()
    ).execute()
    
    if not response.data:
        return pd.DataFrame(columns=['ds', 'y'])
    
    # Convert to DataFrame
    df = pd.DataFrame(response.data)
    df['txn_date'] = pd.to_datetime(df['txn_date']).dt.date
    df['amount'] = df['amount'].astype(float)
    
    # Make debits negative
    df['signed_amount'] = df.apply(
        lambda row: row['amount'] if row['type'] == 'CREDIT' else -row['amount'],
        axis=1
    )
    
    # Aggregate by date
    daily = df.groupby('txn_date')['signed_amount'].sum().reset_index()
    daily.columns = ['ds', 'y']
    daily['ds'] = pd.to_datetime(daily['ds'])
    
    # Fill missing dates with 0
    if len(daily) > 0:
        date_range = pd.date_range(start=daily['ds'].min(), end=daily['ds'].max(), freq='D')
        daily = daily.set_index('ds').reindex(date_range, fill_value=0).reset_index()
        daily.columns = ['ds', 'y']
    
    return daily


def get_current_balance(user_id: str) -> float:
    """Get current total balance."""
    supabase = get_supabase()
    
    response = supabase.table('accounts').select('balance').eq(
        'user_id', user_id
    ).execute()
    
    return sum(acc['balance'] for acc in response.data) if response.data else 0


def train_and_forecast(
    user_id: str,
    forecast_months: Optional[int] = None
) -> ForecastResult:
    """
    Train Prophet model and generate forecast.
    """
    settings = get_settings()
    forecast_months = forecast_months or settings.forecast_months
    
    # Get historical data
    daily_cf = get_daily_cash_flow(user_id, months=12)
    current_balance = get_current_balance(user_id)
    
    if len(daily_cf) < 30:
        # Not enough data for meaningful forecast
        return ForecastResult(
            user_id=user_id,
            generated_at=datetime.now(),
            forecast_months=forecast_months,
            current_balance=current_balance,
            forecasts=[],
            predicted_runway_months=None,
            trend='insufficient_data',
            confidence_score=0
        )
    
    # Try to use Prophet, fall back to simple linear forecast if it fails
    model = get_prophet_model()
    
    if model is None:
        # Fallback: simple linear extrapolation
        return _simple_forecast(user_id, daily_cf, current_balance, forecast_months)
    
    try:
        # Fit model
        model.fit(daily_cf)
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=forecast_months * 30)
        
        # Predict
        forecast = model.predict(future)
    except Exception as e:
        print(f"Prophet prediction failed: {e}, using fallback")
        return _simple_forecast(user_id, daily_cf, current_balance, forecast_months)
    
    # Get only future predictions
    last_historical_date = daily_cf['ds'].max()
    future_forecast = forecast[forecast['ds'] > last_historical_date]
    
    # Aggregate to monthly for cleaner output
    future_forecast['month'] = future_forecast['ds'].dt.to_period('M')
    monthly_forecast = future_forecast.groupby('month').agg({
        'yhat': 'sum',
        'yhat_lower': 'sum',
        'yhat_upper': 'sum'
    }).reset_index()
    
    # Calculate cumulative balance
    forecasts = []
    running_balance = current_balance
    
    for _, row in monthly_forecast.iterrows():
        month_start = row['month'].to_timestamp()
        predicted_net = row['yhat']
        lower = row['yhat_lower']
        upper = row['yhat_upper']
        
        running_balance += predicted_net
        
        forecasts.append(ForecastPoint(
            date=month_start,
            predicted_balance=round(running_balance, 2),
            lower_bound=round(running_balance + (lower - predicted_net), 2),
            upper_bound=round(running_balance + (upper - predicted_net), 2),
            predicted_net_flow=round(predicted_net, 2)
        ))
    
    # Determine trend
    if len(forecasts) >= 2:
        first_balance = forecasts[0].predicted_balance
        last_balance = forecasts[-1].predicted_balance
        
        if last_balance > first_balance * 1.1:
            trend = 'improving'
        elif last_balance < first_balance * 0.9:
            trend = 'declining'
        else:
            trend = 'stable'
    else:
        trend = 'stable'
    
    # Calculate predicted runway
    predicted_runway = None
    for i, fp in enumerate(forecasts):
        if fp.predicted_balance <= 0:
            # Interpolate to find exact month
            if i > 0:
                prev_balance = forecasts[i-1].predicted_balance
                rate = prev_balance - fp.predicted_balance
                if rate > 0:
                    months_to_zero = prev_balance / rate
                    predicted_runway = round(i + months_to_zero, 1)
            else:
                predicted_runway = round(i + 0.5, 1)
            break
    
    # Calculate confidence score based on data quality
    data_points = len(daily_cf)
    confidence = min(1.0, data_points / 365)  # Full confidence at 1 year of data
    
    # Reduce confidence if high variance
    variance_ratio = daily_cf['y'].std() / abs(daily_cf['y'].mean()) if daily_cf['y'].mean() != 0 else 1
    if variance_ratio > 2:
        confidence *= 0.7
    
    return ForecastResult(
        user_id=user_id,
        generated_at=datetime.now(),
        forecast_months=forecast_months,
        current_balance=current_balance,
        forecasts=forecasts,
        predicted_runway_months=predicted_runway,
        trend=trend,
        confidence_score=round(confidence, 2)
    )


def get_forecast_summary(user_id: str) -> dict:
    """
    Get forecast summary suitable for LLM consumption.
    """
    result = train_and_forecast(user_id)
    
    if not result.forecasts:
        return {
            'status': 'insufficient_data',
            'message': 'Not enough transaction history to generate forecast. Need at least 30 days of data.',
            'current_balance': f"₹{result.current_balance:,.2f}"
        }
    
    # Format monthly forecasts
    monthly_predictions = []
    for fp in result.forecasts:
        monthly_predictions.append({
            'month': fp.date.strftime('%B %Y'),
            'predicted_balance': f"₹{fp.predicted_balance:,.2f}",
            'predicted_balance_raw': fp.predicted_balance,
            'range': f"₹{fp.lower_bound:,.2f} - ₹{fp.upper_bound:,.2f}",
            'monthly_net_flow': f"₹{fp.predicted_net_flow:,.2f}",
            'monthly_net_flow_raw': fp.predicted_net_flow
        })
    
    summary = {
        'generated_at': result.generated_at.isoformat(),
        'current_balance': f"₹{result.current_balance:,.2f}",
        'current_balance_raw': result.current_balance,
        'forecast_horizon': f"{result.forecast_months} months",
        'trend': result.trend,
        'trend_description': {
            'improving': 'Your cash position is expected to improve over the forecast period.',
            'stable': 'Your cash position is expected to remain relatively stable.',
            'declining': 'Your cash position is expected to decline. Consider reviewing expenses.',
            'insufficient_data': 'Not enough data to determine trend.'
        }.get(result.trend, 'Unknown'),
        'predicted_runway_months': result.predicted_runway_months,
        'runway_warning': result.predicted_runway_months is not None and result.predicted_runway_months < 6,
        'confidence_score': f"{result.confidence_score * 100:.0f}%",
        'confidence_raw': result.confidence_score,
        'monthly_predictions': monthly_predictions
    }
    
    return summary


def _simple_forecast(
    user_id: str,
    daily_cf: pd.DataFrame,
    current_balance: float,
    forecast_months: int
) -> ForecastResult:
    """
    Simple linear forecast fallback when Prophet fails.
    Uses rolling average to predict future cash flow.
    """
    # Calculate monthly averages from historical data
    daily_cf['month'] = daily_cf['ds'].dt.to_period('M')
    monthly_hist = daily_cf.groupby('month')['y'].sum().reset_index()
    
    if len(monthly_hist) < 2:
        return ForecastResult(
            user_id=user_id,
            generated_at=datetime.now(),
            forecast_months=forecast_months,
            current_balance=current_balance,
            forecasts=[],
            predicted_runway_months=None,
            trend='insufficient_data',
            confidence_score=0
        )
    
    # Use last 3 months average as prediction
    recent_months = monthly_hist.tail(3)['y'].values
    avg_monthly_flow = float(np.mean(recent_months))
    std_monthly_flow = float(np.std(recent_months)) if len(recent_months) > 1 else abs(avg_monthly_flow) * 0.2
    
    # Generate forecast
    forecasts = []
    running_balance = current_balance
    start_date = datetime.now().replace(day=1)
    
    for i in range(forecast_months):
        month_date = start_date + timedelta(days=30 * (i + 1))
        running_balance += avg_monthly_flow
        
        forecasts.append(ForecastPoint(
            date=month_date,
            predicted_balance=round(running_balance, 2),
            lower_bound=round(running_balance - std_monthly_flow * 1.5, 2),
            upper_bound=round(running_balance + std_monthly_flow * 1.5, 2),
            predicted_net_flow=round(avg_monthly_flow, 2)
        ))
    
    # Determine trend
    if avg_monthly_flow > 0:
        trend = 'improving'
    elif avg_monthly_flow < -abs(current_balance * 0.05):
        trend = 'declining'
    else:
        trend = 'stable'
    
    # Calculate runway
    predicted_runway = None
    if avg_monthly_flow < 0:
        predicted_runway = round(current_balance / abs(avg_monthly_flow), 1)
    
    # Lower confidence for simple model
    confidence = min(0.6, len(monthly_hist) / 12 * 0.6)
    
    return ForecastResult(
        user_id=user_id,
        generated_at=datetime.now(),
        forecast_months=forecast_months,
        current_balance=current_balance,
        forecasts=forecasts,
        predicted_runway_months=predicted_runway,
        trend=trend,
        confidence_score=round(confidence, 2)
    )
