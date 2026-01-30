import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../components/Layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage, clearChatSession } from '../lib/api';
import './Chat.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function Chat() {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Add welcome message on mount
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `Hello${profile?.business_name ? `, ${profile.business_name}` : ''}! 👋 I'm your financial advisor. I have access to your transaction history, account balances, and financial metrics.

You can ask me things like:
• "Can I afford to buy furniture worth ₹4 lakh?"
• "Should I take a loan of ₹10 lakh?"
• "What's my current runway?"
• "How much am I spending on marketing?"
• "Is my business cash flow healthy?"

How can I help you today?`,
                timestamp: new Date()
            }]);
        }
    }, [profile]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading || !user) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await sendChatMessage(
                user.id,
                userMessage.content,
                sessionId || undefined
            );

            // Save session ID for conversation continuity
            if (response.session_id) {
                setSessionId(response.session_id);
            }

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Chat error:', error);
            
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: error.response?.data?.error || 
                    'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = async () => {
        if (sessionId && user) {
            try {
                await clearChatSession(user.id, sessionId);
            } catch (error) {
                console.error('Failed to clear session:', error);
            }
        }
        setSessionId(null);
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Chat cleared! How can I help you with your finances today?`,
            timestamp: new Date()
        }]);
    };

    const formatMessage = (content: string) => {
        // Convert markdown-like formatting to HTML
        return content
            .split('\n')
            .map((line, i) => {
                // Bold text
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Bullet points
                if (line.startsWith('• ') || line.startsWith('- ')) {
                    return `<li key=${i}>${line.substring(2)}</li>`;
                }
                // Numbered lists
                if (/^\d+\.\s/.test(line)) {
                    return `<li key=${i}>${line.substring(line.indexOf(' ') + 1)}</li>`;
                }
                return line;
            })
            .join('<br/>');
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <div className="chat-container">
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <h1>💬 Financial Advisor</h1>
                            <p>Ask questions about your business finances</p>
                        </div>
                        <button 
                            className="clear-chat-btn"
                            onClick={clearChat}
                            title="Start new conversation"
                        >
                            🔄 New Chat
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`chat-message ${message.role}`}
                            >
                                <div className="message-avatar">
                                    {message.role === 'user' ? '👤' : '🤖'}
                                </div>
                                <div className="message-content">
                                    <div 
                                        className="message-text"
                                        dangerouslySetInnerHTML={{ 
                                            __html: formatMessage(message.content) 
                                        }}
                                    />
                                    <div className="message-time">
                                        {message.timestamp.toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="chat-message assistant">
                                <div className="message-avatar">🤖</div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-container">
                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            placeholder="Ask about your finances..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            rows={1}
                        />
                        <button
                            className="send-btn"
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? '⏳' : '➤'}
                        </button>
                    </div>
                    
                    <div className="chat-disclaimer">
                        This advisor uses AI to analyze your financial data. 
                        Always verify important decisions with a qualified financial professional.
                    </div>
                </div>
            </main>
        </div>
    );
}
