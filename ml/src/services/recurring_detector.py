"""
Recurring Transaction Detector

Analyzes transaction history to identify recurring patterns like:
- Monthly rent payments
- Bi-weekly payroll
- Quarterly tax payments
- Monthly subscriptions
"""

import hashlib
import re
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional

import numpy as np
from ..database import get_supabase
from ..models import RecurringTransaction


# Common frequency patterns (in days)
FREQUENCY_PATTERNS = {
    7: "weekly",
    14: "bi-weekly", 
    30: "monthly",
    60: "bi-monthly",
    90: "quarterly",
    180: "semi-annually",
    365: "annually"
}

# Tolerance for amount matching (10%)
AMOUNT_TOLERANCE = 0.10

# Minimum occurrences to consider a pattern recurring
MIN_OCCURRENCES = 2

# Maximum days variance for frequency detection
FREQUENCY_VARIANCE_DAYS = 5


def normalize_narration(narration: str) -> str:
    """
    Normalize transaction narration to find patterns.
    Removes variable parts like dates, invoice numbers, etc.
    """
    if not narration:
        return ""
    
    text = narration.upper().strip()
    
    # Remove common variable patterns
    patterns_to_remove = [
        r'INV[#\-]?\d+',           # Invoice numbers
        r'TXN[#\-]?\d+',           # Transaction IDs
        r'REF[#\-]?\d+',           # Reference numbers
        r'\d{4,}',                  # Long numbers (account numbers, etc.)
        r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # Dates
        r'(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*\d{0,4}',  # Month names
        r'Q[1-4]\s*FY\d{2}',        # Quarterly references
        r'FY\s*\d{2,4}',            # Fiscal year references
    ]
    
    for pattern in patterns_to_remove:
        text = re.sub(pattern, '*', text)
    
    # Collapse multiple spaces and asterisks
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\*+', '*', text)
    
    return text.strip()


def generate_pattern_hash(narration_pattern: str, avg_amount: float, frequency_days: int) -> str:
    """Generate a unique hash for a recurring pattern."""
    # Round amount to nearest 100 for grouping similar amounts
    amount_bucket = round(avg_amount / 100) * 100
    content = f"{narration_pattern}|{amount_bucket}|{frequency_days}"
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def calculate_frequency(dates: list[datetime]) -> tuple[int, float]:
    """
    Calculate the most likely frequency from a list of dates.
    Returns (frequency_days, confidence).
    """
    if len(dates) < 2:
        return 30, 0.0  # Default to monthly with zero confidence
    
    # Sort dates and calculate intervals
    sorted_dates = sorted(dates)
    intervals = []
    
    for i in range(1, len(sorted_dates)):
        diff = (sorted_dates[i] - sorted_dates[i-1]).days
        if diff > 0:  # Ignore same-day transactions
            intervals.append(diff)
    
    if not intervals:
        return 30, 0.0
    
    avg_interval = np.mean(intervals)
    std_interval = np.std(intervals) if len(intervals) > 1 else 0
    
    # Find the closest standard frequency
    best_freq = 30
    best_diff = float('inf')
    
    for freq_days in FREQUENCY_PATTERNS.keys():
        diff = abs(avg_interval - freq_days)
        if diff < best_diff:
            best_diff = diff
            best_freq = freq_days
    
    # Calculate confidence based on how consistent the intervals are
    if std_interval == 0:
        confidence = 1.0
    else:
        # Lower std deviation = higher confidence
        cv = std_interval / avg_interval if avg_interval > 0 else 1
        confidence = max(0, min(1, 1 - cv))
    
    # Reduce confidence if best match is far from actual average
    if best_diff > FREQUENCY_VARIANCE_DAYS:
        confidence *= 0.5
    
    return best_freq, round(confidence, 2)


def group_similar_transactions(transactions: list[dict]) -> dict:
    """
    Group transactions by similar narration patterns.
    Returns dict of pattern -> list of transactions.
    """
    groups = defaultdict(list)
    
    for txn in transactions:
        pattern = normalize_narration(txn.get('narration', ''))
        if pattern and len(pattern) > 3:  # Skip very short patterns
            groups[pattern].append(txn)
    
    return groups


def detect_recurring_for_user(user_id: str) -> list[RecurringTransaction]:
    """
    Detect all recurring transaction patterns for a user.
    """
    supabase = get_supabase()
    
    # Fetch all transactions for the user (DEBIT only for now - expenses)
    response = supabase.table('transactions').select('*').eq(
        'user_id', user_id
    ).eq('type', 'DEBIT').order('txn_date', desc=True).execute()
    
    transactions = response.data
    
    if not transactions:
        return []
    
    # Group by normalized narration pattern
    pattern_groups = group_similar_transactions(transactions)
    
    recurring_patterns = []
    
    for pattern, txns in pattern_groups.items():
        if len(txns) < MIN_OCCURRENCES:
            continue
        
        # Calculate average amount
        amounts = [t['amount'] for t in txns]
        avg_amount = np.mean(amounts)
        amount_std = np.std(amounts)
        
        # Check if amounts are consistent (within tolerance)
        amount_cv = amount_std / avg_amount if avg_amount > 0 else 1
        if amount_cv > AMOUNT_TOLERANCE * 2:  # Allow some variance
            continue
        
        # Parse dates
        dates = []
        for t in txns:
            try:
                dt = datetime.fromisoformat(t['txn_date'].replace('Z', '+00:00'))
                dates.append(dt)
            except:
                continue
        
        if len(dates) < MIN_OCCURRENCES:
            continue
        
        # Calculate frequency
        frequency_days, freq_confidence = calculate_frequency(dates)
        
        # Skip if confidence is too low
        if freq_confidence < 0.3:
            continue
        
        # Determine category (use most common)
        categories = [t.get('category') for t in txns if t.get('category')]
        category = max(set(categories), key=categories.count) if categories else None
        
        # Calculate next expected date
        last_date = max(dates)
        next_expected = last_date + timedelta(days=frequency_days)
        
        # Generate pattern hash
        pattern_hash = generate_pattern_hash(pattern, avg_amount, frequency_days)
        
        # Get account_id (use the most common one)
        account_ids = [t['account_id'] for t in txns]
        account_id = max(set(account_ids), key=account_ids.count)
        
        recurring_patterns.append(RecurringTransaction(
            user_id=user_id,
            account_id=account_id,
            pattern_hash=pattern_hash,
            avg_amount=round(avg_amount, 2),
            frequency_days=frequency_days,
            last_occurrence=last_date,
            next_expected=next_expected,
            narration_pattern=pattern,
            category=category,
            confidence=freq_confidence,
            transaction_count=len(txns)
        ))
    
    return recurring_patterns


def save_recurring_patterns(patterns: list[RecurringTransaction]) -> int:
    """
    Save or update recurring patterns in the database.
    Returns the number of patterns saved.
    """
    if not patterns:
        return 0
    
    supabase = get_supabase()
    saved_count = 0
    
    for pattern in patterns:
        data = {
            'user_id': pattern.user_id,
            'account_id': pattern.account_id,
            'pattern_hash': pattern.pattern_hash,
            'avg_amount': pattern.avg_amount,
            'frequency_days': pattern.frequency_days,
            'last_occurrence': pattern.last_occurrence.isoformat(),
            'next_expected': pattern.next_expected.isoformat(),
            'narration_pattern': pattern.narration_pattern,
            'category': pattern.category,
            'confidence': pattern.confidence,
            'transaction_count': pattern.transaction_count
        }
        
        # Upsert based on user_id + pattern_hash
        try:
            supabase.table('recurring_transactions').upsert(
                data,
                on_conflict='user_id,pattern_hash'
            ).execute()
            saved_count += 1
        except Exception as e:
            print(f"Error saving recurring pattern: {e}")
    
    return saved_count


def get_recurring_for_user(user_id: str) -> list[dict]:
    """Get all stored recurring patterns for a user."""
    supabase = get_supabase()
    
    response = supabase.table('recurring_transactions').select('*').eq(
        'user_id', user_id
    ).order('avg_amount', desc=True).execute()
    
    return response.data


def run_detection(user_id: str) -> dict:
    """
    Run full recurring transaction detection for a user.
    Returns summary of detection results.
    """
    # Detect patterns
    patterns = detect_recurring_for_user(user_id)
    
    # Save to database
    saved_count = save_recurring_patterns(patterns)
    
    # Calculate total recurring monthly expense
    monthly_recurring = 0
    for p in patterns:
        monthly_amount = p.avg_amount * (30 / p.frequency_days)
        monthly_recurring += monthly_amount
    
    return {
        'patterns_detected': len(patterns),
        'patterns_saved': saved_count,
        'estimated_monthly_recurring': round(monthly_recurring, 2),
        'patterns': [
            {
                'narration': p.narration_pattern,
                'amount': p.avg_amount,
                'frequency': FREQUENCY_PATTERNS.get(p.frequency_days, f"every {p.frequency_days} days"),
                'category': p.category,
                'confidence': p.confidence,
                'occurrences': p.transaction_count
            }
            for p in patterns
        ]
    }
