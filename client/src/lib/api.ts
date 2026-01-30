import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Consent APIs
export const createConsent = async (userId: string, phoneNumber: string, redirectUrl: string) => {
    const response = await api.post('/api/consent/create', {
        userId,
        phoneNumber,
        redirectUrl,
    });
    return response.data;
};

export const getConsentStatus = async (consentId: string) => {
    const response = await api.get(`/api/consent/${consentId}/status`);
    return response.data;
};

export const fetchFinancialData = async (consentId: string) => {
    const response = await api.post(`/api/consent/${consentId}/fetch-data`);
    return response.data;
};

// Chat APIs
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export interface ChatResponse {
    response: string;
    session_id: string;
    data_accessed?: string[];
}

export const sendChatMessage = async (
    userId: string,
    message: string,
    sessionId?: string
): Promise<ChatResponse> => {
    const response = await api.post(`/api/ml/chat/${userId}`, {
        message,
        session_id: sessionId,
    });
    return response.data;
};

export const clearChatSession = async (userId: string, sessionId: string) => {
    const response = await api.delete(`/api/ml/chat/${userId}/session/${sessionId}`);
    return response.data;
};

export const getChatHistory = async (userId: string, sessionId: string) => {
    const response = await api.get(`/api/ml/chat/${userId}/history/${sessionId}`);
    return response.data;
};

// ML Metrics APIs
export const getFinancialMetrics = async (userId: string) => {
    const response = await api.get(`/api/ml/metrics/${userId}`);
    return response.data;
};

export const getCashFlowForecast = async (userId: string, days?: number) => {
    const response = await api.get(`/api/ml/forecast/${userId}`, {
        params: { days },
    });
    return response.data;
};

export const getRecurringTransactions = async (userId: string) => {
    const response = await api.get(`/api/ml/recurring/${userId}`);
    return response.data;
};
