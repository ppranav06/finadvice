"""
Financial Advisor Chat Service

Uses Google Gemini with function calling to provide intelligent
financial advice based on user's transaction data and metrics.
"""

import json
from datetime import datetime
from typing import Optional
from collections import defaultdict

import google.generativeai as genai

from ..config import get_settings
from ..database import get_supabase
from .metrics_calculator import get_metrics_summary, calculate_metrics
from .forecaster import get_forecast_summary
from .recurring_detector import get_recurring_for_user, FREQUENCY_PATTERNS


# In-memory session storage (conversation history)
_sessions: dict[str, list[dict]] = defaultdict(list)

# Maximum conversation history to keep per session
MAX_HISTORY_LENGTH = 20


# System prompt for the financial advisor
SYSTEM_PROMPT = """You are an intelligent financial advisor for small and medium businesses in India. 
You have access to the user's real financial data including their bank transactions, account balances, 
burn rate, runway, and cash flow forecasts.

IMPORTANT: Always respond in English only.

Your role is to:
1. Answer questions about the user's financial health using their actual data
2. Provide data-driven advice on business decisions (purchases, loans, hiring, etc.)
3. Clearly distinguish between advice based on their data vs general financial knowledge
4. Be detailed and show your reasoning with specific numbers from their data
5. If a question requires a short answer, be concise; otherwise explain thoroughly

When giving advice:
- Always cite specific numbers from the data (e.g., "Your current balance is ₹41.2L with a monthly burn of ₹3.1L")
- Calculate impact on runway when advising on expenses
- Consider both recurring and one-time expenses
- Be practical and actionable
- If you don't have enough data to answer, say so clearly

Currency: Always use Indian Rupees (₹). Use lakhs (L) for amounts over ₹1,00,000 and crores (Cr) for amounts over ₹1,00,00,000.

For general financial questions not related to their specific data, you can provide educational information but clearly state it's general advice, not based on their data.

Today's date is: """ + datetime.now().strftime("%B %d, %Y")


# Define available functions for the LLM
AVAILABLE_FUNCTIONS = [
    {
        "name": "get_current_balance",
        "description": "Get the user's current total balance across all linked bank accounts",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_financial_metrics",
        "description": "Get comprehensive financial metrics including burn rate, runway, revenue growth, expense breakdown, and cash flow volatility",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_cash_flow_forecast",
        "description": "Get a 3-month cash flow forecast with predicted balances and trend analysis",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_recurring_expenses",
        "description": "Get a list of detected recurring expenses like rent, salaries, subscriptions, and loan EMIs with their amounts and frequencies",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_recent_transactions",
        "description": "Get the most recent transactions for the user",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of transactions to retrieve (default: 10, max: 50)"
                },
                "type": {
                    "type": "string",
                    "enum": ["CREDIT", "DEBIT", "ALL"],
                    "description": "Filter by transaction type"
                }
            },
            "required": []
        }
    },
    {
        "name": "get_expense_breakdown",
        "description": "Get a breakdown of expenses by category (Payroll, Rent, Utilities, Marketing, etc.) with percentages",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "calculate_expense_impact",
        "description": "Calculate how a potential expense would impact the business runway and financial health",
        "parameters": {
            "type": "object",
            "properties": {
                "amount": {
                    "type": "number",
                    "description": "The expense amount in rupees"
                },
                "is_recurring": {
                    "type": "boolean",
                    "description": "Whether this is a recurring monthly expense or one-time"
                }
            },
            "required": ["amount"]
        }
    }
]


def _execute_function(user_id: str, function_name: str, arguments: dict) -> dict:
    """Execute a function call and return the result."""
    
    supabase = get_supabase()
    
    if function_name == "get_current_balance":
        response = supabase.table('accounts').select('balance, fip_name, account_type').eq(
            'user_id', user_id
        ).execute()
        
        accounts = response.data or []
        total = sum(acc['balance'] for acc in accounts)
        
        return {
            "total_balance": total,
            "total_balance_formatted": f"₹{total:,.2f}",
            "accounts": [
                {
                    "bank": acc['fip_name'],
                    "type": acc['account_type'],
                    "balance": acc['balance'],
                    "balance_formatted": f"₹{acc['balance']:,.2f}"
                }
                for acc in accounts
            ]
        }
    
    elif function_name == "get_financial_metrics":
        return get_metrics_summary(user_id)
    
    elif function_name == "get_cash_flow_forecast":
        return get_forecast_summary(user_id)
    
    elif function_name == "get_recurring_expenses":
        patterns = get_recurring_for_user(user_id)
        
        formatted = []
        total_monthly = 0
        
        for p in patterns:
            monthly_amount = p['avg_amount'] * (30 / p['frequency_days'])
            total_monthly += monthly_amount
            
            formatted.append({
                "description": p['narration_pattern'],
                "amount": p['avg_amount'],
                "amount_formatted": f"₹{p['avg_amount']:,.2f}",
                "frequency": FREQUENCY_PATTERNS.get(p['frequency_days'], f"every {p['frequency_days']} days"),
                "category": p['category'],
                "monthly_equivalent": round(monthly_amount, 2),
                "monthly_formatted": f"₹{monthly_amount:,.2f}/month"
            })
        
        return {
            "recurring_expenses": formatted,
            "total_monthly_recurring": round(total_monthly, 2),
            "total_monthly_formatted": f"₹{total_monthly:,.2f}/month"
        }
    
    elif function_name == "get_recent_transactions":
        limit = min(arguments.get('limit', 10), 50)
        txn_type = arguments.get('type', 'ALL')
        
        query = supabase.table('transactions').select(
            'narration, amount, type, category, txn_date, mode'
        ).eq('user_id', user_id).order('txn_date', desc=True).limit(limit)
        
        if txn_type != 'ALL':
            query = query.eq('type', txn_type)
        
        response = query.execute()
        
        return {
            "transactions": [
                {
                    "description": t['narration'],
                    "amount": t['amount'],
                    "amount_formatted": f"₹{t['amount']:,.2f}",
                    "type": t['type'],
                    "category": t['category'],
                    "date": t['txn_date'],
                    "mode": t['mode']
                }
                for t in (response.data or [])
            ],
            "count": len(response.data or [])
        }
    
    elif function_name == "get_expense_breakdown":
        metrics = get_metrics_summary(user_id)
        return {
            "expense_by_category": metrics.get('expense_breakdown', {}),
            "gross_monthly_expenses": metrics.get('monthly_averages', {}).get('gross_expenses_raw', 0),
            "gross_monthly_formatted": metrics.get('monthly_averages', {}).get('gross_expenses', '₹0')
        }
    
    elif function_name == "calculate_expense_impact":
        amount = arguments.get('amount', 0)
        is_recurring = arguments.get('is_recurring', False)
        
        metrics = calculate_metrics(user_id)
        current_balance = metrics.total_balance
        current_burn = metrics.net_burn_rate
        current_runway = metrics.runway_months
        
        if is_recurring:
            # Recurring expense impacts monthly burn rate
            new_burn = current_burn + amount
            new_runway = current_balance / new_burn if new_burn > 0 else None
            
            return {
                "expense_type": "recurring (monthly)",
                "expense_amount": f"₹{amount:,.2f}/month",
                "current_balance": f"₹{current_balance:,.2f}",
                "current_monthly_burn": f"₹{current_burn:,.2f}",
                "current_runway_months": current_runway,
                "new_monthly_burn": f"₹{new_burn:,.2f}",
                "new_runway_months": round(new_runway, 1) if new_runway else "Profitable (no runway limit)",
                "runway_change_months": round(current_runway - new_runway, 1) if (current_runway and new_runway) else None,
                "recommendation": _get_expense_recommendation(current_runway, new_runway if new_runway else float('inf'), amount, is_recurring)
            }
        else:
            # One-time expense impacts balance directly
            new_balance = current_balance - amount
            new_runway = new_balance / current_burn if current_burn > 0 else None
            
            return {
                "expense_type": "one-time",
                "expense_amount": f"₹{amount:,.2f}",
                "current_balance": f"₹{current_balance:,.2f}",
                "balance_after_expense": f"₹{new_balance:,.2f}",
                "current_runway_months": current_runway,
                "new_runway_months": round(new_runway, 1) if new_runway else "Profitable (no runway limit)",
                "runway_change_months": round(current_runway - new_runway, 1) if (current_runway and new_runway) else None,
                "percent_of_balance": round(amount / current_balance * 100, 1) if current_balance > 0 else 100,
                "recommendation": _get_expense_recommendation(current_runway, new_runway if new_runway else float('inf'), amount, is_recurring)
            }
    
    return {"error": f"Unknown function: {function_name}"}


def _get_expense_recommendation(current_runway: Optional[float], new_runway: float, amount: float, is_recurring: bool) -> str:
    """Generate a recommendation based on runway impact."""
    
    if current_runway is None:
        return "Your business is currently profitable. This expense is likely affordable, but consider its impact on your profit margins."
    
    if new_runway is None or new_runway > 12:
        return "This expense appears affordable. Your runway remains healthy at over 12 months."
    elif new_runway > 6:
        return "This expense is manageable but will reduce your runway. Consider if it's essential for business growth."
    elif new_runway > 3:
        return "Caution advised. This expense will bring your runway below 6 months. Only proceed if absolutely necessary for business survival or growth."
    else:
        return "High risk. This expense would leave you with less than 3 months of runway. Strongly recommend deferring or finding alternative funding first."


def _get_gemini_model():
    """Initialize and return the Gemini model."""
    settings = get_settings()
    
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    
    genai.configure(api_key=settings.gemini_api_key)
    
    return genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=SYSTEM_PROMPT,
        tools=[{"function_declarations": AVAILABLE_FUNCTIONS}]
    )


def chat(
    user_id: str,
    message: str,
    session_id: Optional[str] = None
) -> dict:
    """
    Process a chat message and return the AI response.
    
    Args:
        user_id: The user's ID for fetching their financial data
        message: The user's message
        session_id: Optional session ID for conversation continuity
    
    Returns:
        dict with 'response' text and 'session_id'
    """
    
    # Generate session ID if not provided
    if not session_id:
        session_id = f"{user_id}_{datetime.now().timestamp()}"
    
    # Get or create conversation history
    history = _sessions[session_id]
    
    try:
        model = _get_gemini_model()
        
        # Build conversation for Gemini
        chat_session = model.start_chat(history=[
            {"role": msg["role"], "parts": [msg["content"]]}
            for msg in history
        ])
        
        # Send user message
        response = chat_session.send_message(message)
        
        # Handle function calls in a loop
        max_iterations = 10  # Prevent infinite loops
        iterations = 0
        
        while iterations < max_iterations:
            iterations += 1
            
            # Check if we have any parts in the response
            if not response.candidates or not response.candidates[0].content.parts:
                break
            
            parts = response.candidates[0].content.parts
            
            # Collect ALL function calls from ALL parts
            function_calls = []
            for part in parts:
                if hasattr(part, 'function_call') and part.function_call and part.function_call.name:
                    function_calls.append(part.function_call)
            
            # If no function calls, we have the final text response
            if not function_calls:
                break
            
            # Execute ALL function calls and collect responses
            function_responses = []
            for func_call in function_calls:
                func_name = func_call.name
                func_args = dict(func_call.args) if func_call.args else {}
                
                print(f"🔧 Executing function: {func_name}({func_args})")
                
                # Execute the function
                result = _execute_function(user_id, func_name, func_args)
                
                function_responses.append(
                    genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=func_name,
                            response=result
                        )
                    )
                )
            
            # Send ALL function responses back to the model at once
            response = chat_session.send_message(function_responses)
            print(f"📨 Sent {len(function_responses)} function response(s)")
        
        # Extract final text response safely
        response_text = ""
        try:
            response_text = response.text
        except ValueError as e:
            print(f"⚠️ response.text failed: {e}")
            print(f"⚠️ Response candidates: {response.candidates}")
            if response.candidates:
                print(f"⚠️ Finish reason: {response.candidates[0].finish_reason}")
                print(f"⚠️ Content parts: {response.candidates[0].content.parts if response.candidates[0].content else 'No content'}")
            
            # response.text failed - try to extract from parts directly
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'text') and part.text:
                        response_text += part.text
            
            if not response_text:
                # Try one more approach - check if there's a pending function call we missed
                if response.candidates and response.candidates[0].content.parts:
                    part = response.candidates[0].content.parts[0]
                    if hasattr(part, 'function_call') and part.function_call and part.function_call.name:
                        # There's still a function call - execute it
                        func_call = part.function_call
                        func_name = func_call.name
                        func_args = dict(func_call.args) if func_call.args else {}
                        
                        print(f"🔧 Found pending function: {func_name}({func_args})")
                        result = _execute_function(user_id, func_name, func_args)
                        
                        response = chat_session.send_message(
                            genai.protos.Part(
                                function_response=genai.protos.FunctionResponse(
                                    name=func_name,
                                    response=result
                                )
                            )
                        )
                        try:
                            response_text = response.text
                        except:
                            pass
                
                if not response_text:
                    response_text = "I've processed your request but couldn't generate a response. Please try rephrasing your question."
        
        # Update history
        history.append({"role": "user", "content": message})
        history.append({"role": "model", "content": response_text})
        
        # Trim history if too long
        if len(history) > MAX_HISTORY_LENGTH * 2:
            _sessions[session_id] = history[-MAX_HISTORY_LENGTH * 2:]
        
        return {
            "response": response_text,
            "session_id": session_id
        }
        
    except Exception as e:
        print(f"Chat error: {e}")
        return {
            "response": f"I'm sorry, I encountered an error processing your request. Please try again. (Error: {str(e)})",
            "session_id": session_id,
            "error": True
        }


def clear_session(session_id: str) -> bool:
    """Clear a conversation session."""
    if session_id in _sessions:
        del _sessions[session_id]
        return True
    return False


def get_session_history(session_id: str) -> list[dict]:
    """Get conversation history for a session."""
    return _sessions.get(session_id, [])
