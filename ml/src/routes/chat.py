"""
Chat API endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..services.chat import chat, clear_session, get_session_history

router = APIRouter()


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response body for chat endpoint."""
    response: str
    session_id: str
    error: Optional[bool] = None


@router.post("/chat/{user_id}", response_model=ChatResponse)
async def send_chat_message(user_id: str, request: ChatRequest):
    """
    Send a message to the financial advisor chatbot.
    
    The chatbot has access to the user's financial data and can:
    - Answer questions about their financial health
    - Advise on business decisions (purchases, loans, hiring)
    - Provide data-driven recommendations
    
    Include session_id to maintain conversation context.
    """
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        result = chat(
            user_id=user_id,
            message=request.message,
            session_id=request.session_id
        )
        
        return ChatResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/chat/{user_id}/session/{session_id}")
async def delete_session(user_id: str, session_id: str):
    """
    Clear a conversation session.
    Use this to start a fresh conversation.
    """
    success = clear_session(session_id)
    return {
        "success": success,
        "message": "Session cleared" if success else "Session not found"
    }


@router.get("/chat/{user_id}/session/{session_id}/history")
async def get_history(user_id: str, session_id: str):
    """
    Get conversation history for a session.
    """
    history = get_session_history(session_id)
    return {
        "session_id": session_id,
        "message_count": len(history),
        "history": history
    }


@router.get("/chat/health")
async def chat_health():
    """
    Check if chat service is configured properly.
    """
    from ..config import get_settings
    
    settings = get_settings()
    has_api_key = bool(settings.gemini_api_key)
    
    return {
        "status": "healthy" if has_api_key else "unconfigured",
        "model": settings.gemini_model,
        "api_key_configured": has_api_key
    }
