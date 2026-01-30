"""
Caching service for metrics and forecasts.
"""

from datetime import datetime, timedelta
from typing import Optional
import json

from ..database import get_supabase
from ..config import get_settings


def get_cached_data(user_id: str) -> Optional[dict]:
    """
    Get cached metrics and forecast if not expired.
    Returns None if cache is expired or doesn't exist.
    """
    supabase = get_supabase()
    
    response = supabase.table('cached_metrics').select('*').eq(
        'user_id', user_id
    ).single().execute()
    
    if not response.data:
        return None
    
    cache = response.data
    expires_at = datetime.fromisoformat(cache['expires_at'].replace('Z', '+00:00'))
    
    if datetime.now(expires_at.tzinfo) > expires_at:
        return None  # Cache expired
    
    return {
        'metrics': cache['metric_data'],
        'forecast': cache['forecast_data'],
        'calculated_at': cache['calculated_at'],
        'expires_at': cache['expires_at']
    }


def save_cached_data(
    user_id: str,
    metrics: dict,
    forecast: Optional[dict] = None
) -> None:
    """
    Save or update cached metrics and forecast.
    """
    settings = get_settings()
    supabase = get_supabase()
    
    now = datetime.now()
    expires_at = now + timedelta(hours=settings.cache_ttl_hours)
    
    data = {
        'user_id': user_id,
        'metric_data': metrics,
        'forecast_data': forecast,
        'calculated_at': now.isoformat(),
        'expires_at': expires_at.isoformat()
    }
    
    # Upsert based on user_id
    supabase.table('cached_metrics').upsert(
        data,
        on_conflict='user_id'
    ).execute()


def invalidate_cache(user_id: str) -> None:
    """
    Invalidate (delete) cached data for a user.
    Call this when new transactions are added.
    """
    supabase = get_supabase()
    
    supabase.table('cached_metrics').delete().eq(
        'user_id', user_id
    ).execute()
