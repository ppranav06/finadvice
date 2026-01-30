"""
Metrics API endpoints.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from ..services.metrics_calculator import calculate_metrics, get_metrics_summary
from ..services.recurring_detector import run_detection
from ..services.cache import get_cached_data, save_cached_data

router = APIRouter()


@router.get("/metrics/{user_id}")
async def get_metrics(user_id: str, force_refresh: bool = False):
    """
    Get business metrics for a user.
    
    Returns cached metrics if available, otherwise calculates fresh.
    Use force_refresh=true to bypass cache.
    """
    try:
        # Check cache first
        if not force_refresh:
            cached = get_cached_data(user_id)
            if cached and cached.get('metrics'):
                return {
                    'source': 'cache',
                    'calculated_at': cached['calculated_at'],
                    'expires_at': cached['expires_at'],
                    'metrics': cached['metrics']
                }
        
        # Calculate fresh metrics
        metrics = get_metrics_summary(user_id)
        
        # Save to cache
        cached = get_cached_data(user_id)
        forecast = cached.get('forecast') if cached else None
        save_cached_data(user_id, metrics, forecast)
        
        return {
            'source': 'calculated',
            'metrics': metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/{user_id}")
async def run_full_analysis(user_id: str):
    """
    Run full analysis for a user:
    1. Detect recurring transactions
    2. Calculate all metrics
    3. Generate forecast
    4. Cache results
    
    This is the main entry point for refreshing all predictions.
    """
    try:
        from ..services.forecaster import get_forecast_summary
        
        # Step 1: Detect recurring transactions
        recurring_result = run_detection(user_id)
        
        # Step 2: Calculate metrics
        metrics = get_metrics_summary(user_id)
        
        # Step 3: Generate forecast
        forecast = get_forecast_summary(user_id)
        
        # Step 4: Cache results
        save_cached_data(user_id, metrics, forecast)
        
        return {
            'status': 'success',
            'recurring_detection': {
                'patterns_found': recurring_result['patterns_detected'],
                'monthly_recurring': recurring_result['estimated_monthly_recurring']
            },
            'metrics': metrics,
            'forecast': forecast
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/{user_id}/raw")
async def get_raw_metrics(user_id: str):
    """
    Get raw metrics object (not formatted for display).
    Useful for programmatic access.
    """
    try:
        metrics = calculate_metrics(user_id)
        return metrics.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
