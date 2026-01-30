"""
Balance snapshot service for tracking historical balances.
"""

from datetime import datetime, date
from typing import Optional

from ..database import get_supabase


def capture_balance_snapshot(
    user_id: str,
    source: str = 'manual'
) -> dict:
    """
    Capture current balance snapshot for all accounts of a user.
    Returns summary of captured snapshots.
    """
    supabase = get_supabase()
    
    # Get all accounts for user
    response = supabase.table('accounts').select('id, balance').eq(
        'user_id', user_id
    ).execute()
    
    if not response.data:
        return {'captured': 0, 'accounts': []}
    
    today = date.today().isoformat()
    snapshots = []
    
    for account in response.data:
        snapshot_data = {
            'account_id': account['id'],
            'user_id': user_id,
            'balance': account['balance'],
            'snapshot_date': today,
            'source': source
        }
        snapshots.append(snapshot_data)
    
    # Upsert all snapshots (one per account per day)
    for snapshot in snapshots:
        try:
            supabase.table('balance_snapshots').upsert(
                snapshot,
                on_conflict='account_id,snapshot_date'
            ).execute()
        except Exception as e:
            print(f"Error saving snapshot: {e}")
    
    return {
        'captured': len(snapshots),
        'date': today,
        'source': source,
        'accounts': [
            {'account_id': s['account_id'], 'balance': s['balance']}
            for s in snapshots
        ]
    }


def get_balance_history(
    user_id: str,
    days: int = 90
) -> list[dict]:
    """
    Get balance history for a user over the last N days.
    Returns list of {date, total_balance} records.
    """
    supabase = get_supabase()
    
    cutoff = date.today() - __import__('datetime').timedelta(days=days)
    
    response = supabase.table('balance_snapshots').select(
        'snapshot_date, balance'
    ).eq('user_id', user_id).gte(
        'snapshot_date', cutoff.isoformat()
    ).order('snapshot_date').execute()
    
    if not response.data:
        return []
    
    # Aggregate by date (sum across accounts)
    from collections import defaultdict
    daily_totals = defaultdict(float)
    
    for record in response.data:
        daily_totals[record['snapshot_date']] += record['balance']
    
    return [
        {'date': d, 'total_balance': round(b, 2)}
        for d, b in sorted(daily_totals.items())
    ]
