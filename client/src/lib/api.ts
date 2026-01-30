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
