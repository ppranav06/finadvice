"""
Forecast API endpoints.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from ..services.forecaster import train_and_forecast, get_forecast_summary
from ..services.cache import get_cached_data, save_cached_data

router = APIRouter()


@router.get("/forecast/{user_id}")
async def get_forecast(
    user_id: str,
    months: Optional[int] = None,
    force_refresh: bool = False
):
    """
    Get cash flow forecast for a user.
    
    - months: Number of months to forecast (default: 3)
    - force_refresh: Bypass cache and regenerate forecast
    """
    try:
        # Check cache first
        if not force_refresh:
            cached = get_cached_data(user_id)
            if cached and cached.get('forecast'):
                return {
                    'source': 'cache',
                    'generated_at': cached.get('calculated_at'),
                    'expires_at': cached.get('expires_at'),
                    'forecast': cached['forecast']
                }
        
        # Generate fresh forecast
        forecast = get_forecast_summary(user_id)
        
        # Update cache
        cached = get_cached_data(user_id)
        metrics = cached.get('metrics') if cached else {}
        save_cached_data(user_id, metrics, forecast)
        
        return {
            'source': 'calculated',
            'forecast': forecast
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast/{user_id}/raw")
async def get_raw_forecast(user_id: str, months: Optional[int] = None):
    """
    Get raw forecast object (not formatted for display).
    """
    try:
        result = train_and_forecast(user_id, months)
        return result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forecast/{user_id}/retrain")
async def retrain_forecast(user_id: str, months: Optional[int] = None):
    """
    Force retrain the forecast model and update cache.
    Call this weekly or when significant new data arrives.
    """
    try:
        forecast = get_forecast_summary(user_id)
        
        # Update cache
        cached = get_cached_data(user_id)
        metrics = cached.get('metrics') if cached else {}
        save_cached_data(user_id, metrics, forecast)
        
        return {
            'status': 'retrained',
            'forecast': forecast
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
