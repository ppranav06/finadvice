"""
Financial Advisor Chat Service

Uses Google Gemini with function calling to provide intelligent
financial advice based on user's transaction data and metrics.

Uses the new google-genai SDK (not google-generativeai).
"""

import json
from datetime import datetime
from typing import Optional
from collections import defaultdict

from google import genai
from google.genai import types

from ..config import get_settings
from ..database import get_supabase
from .metrics_calculator import get_metrics_summary, calculate_metrics
from .forecaster import get_forecast_summary
from .recurring_detector import get_recurring_for_user, FREQUENCY_PATTERNS


# In-memory session storage (conversation history)
_sessions: dict[str, list[types.Content]] = defaultdict(list)

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


# Define available functions for the LLM using new SDK format
def _get_function_declarations() -> list[types.FunctionDeclaration]:
    """Return function declarations for Gemini tools."""
    return [
        types.FunctionDeclaration(
            name="get_current_balance",
            description="Get the user's current total balance across all linked bank accounts",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
                required=[]
            )
        ),
        types.FunctionDeclaration(
            name="get_financial_metrics",
            description="Get comprehensive financial metrics including burn rate, runway, revenue growth, expense breakdown, and cash flow volatility",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
                required=[]
            )
        ),
        types.FunctionDeclaration(
            name="get_cash_flow_forecast",
            description="Get a 3-month cash flow forecast with predicted balances and trend analysis",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
                required=[]
            )
        ),
        types.FunctionDeclaration(
            name="get_recurring_expenses",
            description="Get a list of detected recurring expenses like rent, salaries, subscriptions, and loan EMIs with their amounts and frequencies",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
                required=[]
            )
        ),
        types.FunctionDeclaration(
            name="get_recent_transactions",
            description="Get the most recent transactions for the user",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "limit": types.Schema(
                        type=types.Type.INTEGER,
                        description="Number of transactions to retrieve (default: 10, max: 50)"
                    ),
                    "type": types.Schema(
                        type=types.Type.STRING,
                        description="Filter by transaction type: CREDIT, DEBIT, or ALL",
                        enum=["CREDIT", "DEBIT", "ALL"]
                    )
                },
                required=[]
            )
        ),
        types.FunctionDeclaration(
            name="get_expense_breakdown",
            description="Get a breakdown of expenses by category (Payroll, Rent, Utilities, Marketing, etc.) with percentages",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
                required=[]
            )
        ),
        types.FunctionDeclaration(
            name="calculate_expense_impact",
            description="Calculate how a potential expense would impact the business runway and financial health",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "amount": types.Schema(
                        type=types.Type.NUMBER,
                        description="The expense amount in rupees"
                    ),
                    "is_recurring": types.Schema(
                        type=types.Type.BOOLEAN,
                        description="Whether this is a recurring monthly expense or one-time"
                    )
                },
                required=["amount"]
            )
        )
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


def _get_gemini_client() -> genai.Client:
    """Initialize and return the Gemini client."""
    settings = get_settings()
    
    if not settings.finadvice_gemini_key:
        raise ValueError("FINADVICE_GEMINI_KEY not configured")
    
    return genai.Client(api_key=settings.finadvice_gemini_key)


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
    
    settings = get_settings()
    
    try:
        client = _get_gemini_client()
        
        # Build contents with history + new message
        contents = list(history)  # Copy existing history
        contents.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=message)]
        ))
        
        # Configure tools
        tools = [
            types.Tool(function_declarations=_get_function_declarations())
        ]
        
        # Generate content config
        generate_config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=tools,
        )
        
        # Send request
        response = client.models.generate_content(
            model=settings.finadvice_gemini_model,
            contents=contents,
            config=generate_config,
        )
        
        # Handle function calls in a loop
        max_iterations = 10
        iterations = 0
        
        while iterations < max_iterations:
            iterations += 1
            
            # Check for function calls in the response
            if not response.candidates or not response.candidates[0].content.parts:
                break
            
            parts = response.candidates[0].content.parts
            
            # Collect ALL function calls from ALL parts
            function_calls = []
            for part in parts:
                if part.function_call:
                    function_calls.append(part.function_call)
            
            # If no function calls, we have the final text response
            if not function_calls:
                break
            
            # Add the model's response (with function calls) to contents
            contents.append(response.candidates[0].content)
            
            # Execute ALL function calls and collect responses
            function_response_parts = []
            for func_call in function_calls:
                func_name = func_call.name
                func_args = dict(func_call.args) if func_call.args else {}
                
                print(f"🔧 Executing function: {func_name}({func_args})")
                
                # Execute the function
                result = _execute_function(user_id, func_name, func_args)
                
                function_response_parts.append(
                    types.Part.from_function_response(
                        name=func_name,
                        response=result
                    )
                )
            
            # Add function responses as a new content block
            contents.append(types.Content(
                role="user",
                parts=function_response_parts
            ))
            
            print(f"📨 Sent {len(function_response_parts)} function response(s)")
            
            # Get next response
            response = client.models.generate_content(
                model=settings.finadvice_gemini_model,
                contents=contents,
                config=generate_config,
            )
        
        # Extract final text response
        response_text = ""
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.text:
                    response_text += part.text
        
        if not response_text:
            response_text = "I've processed your request but couldn't generate a response. Please try rephrasing your question."
        
        # Update history with user message and model response
        history.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=message)]
        ))
        history.append(types.Content(
            role="model",
            parts=[types.Part.from_text(text=response_text)]
        ))
        
        # Trim history if too long
        if len(history) > MAX_HISTORY_LENGTH * 2:
            _sessions[session_id] = history[-MAX_HISTORY_LENGTH * 2:]
        
        return {
            "response": response_text,
            "session_id": session_id
        }
        
    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
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
    history = _sessions.get(session_id, [])
    # Convert Content objects to simple dicts for API response
    return [
        {
            "role": msg.role,
            "content": "".join(part.text for part in msg.parts if part.text)
        }
        for msg in history
    ]
