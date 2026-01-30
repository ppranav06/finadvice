import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getConsentStatus, fetchFinancialData } from '../lib/api';
import './Auth.css';

export function Callback() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Processing your consent...');
    const navigate = useNavigate();
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        handleCallback();
        return () => {
            if (pollingRef.current) clearTimeout(pollingRef.current);
        };
    }, []);

    const handleCallback = async () => {
        const consentId = searchParams.get('id') || searchParams.get('consentId');
        const ecres = searchParams.get('ecres'); // Setu's encrypted response

        if (!consentId) {
            setStatus('error');
            setMessage('No consent ID received. Please try again.');
            return;
        }

        // Start polling for consent status
        pollConsentStatus(consentId, 0);
    };

    const pollConsentStatus = async (consentId: string, attempts: number) => {
        const MAX_ATTEMPTS = 10;
        const POLL_INTERVAL = 2000; // 2 seconds

        if (attempts >= MAX_ATTEMPTS) {
            setStatus('error');
            setMessage('Timeout waiting for consent. Please try again.');
            setTimeout(() => navigate('/'), 3000);
            return;
        }

        try {
            setMessage(`Checking consent status... (${attempts + 1}/${MAX_ATTEMPTS})`);
            const response = await getConsentStatus(consentId);

            if (response.status === 'APPROVED' || response.status === 'ACTIVE') {
                await handleApproved(consentId);
            } else if (response.status === 'REJECTED') {
                setStatus('error');
                setMessage('Consent was rejected. You can try again from the dashboard.');
                setTimeout(() => navigate('/'), 3000);
            } else if (response.status === 'PENDING') {
                // Continue polling
                pollingRef.current = setTimeout(() => {
                    pollConsentStatus(consentId, attempts + 1);
                }, POLL_INTERVAL);
            } else {
                // Unknown status, keep polling
                pollingRef.current = setTimeout(() => {
                    pollConsentStatus(consentId, attempts + 1);
                }, POLL_INTERVAL);
            }
        } catch (error) {
            console.error('Error polling status:', error);
            // Retry on error
            pollingRef.current = setTimeout(() => {
                pollConsentStatus(consentId, attempts + 1);
            }, POLL_INTERVAL);
        }
    };

    const handleApproved = async (consentId: string) => {
        try {
            setMessage('Consent approved! Fetching your bank data...');
            await fetchFinancialData(consentId);
            setStatus('success');
            setMessage('Bank account connected successfully!');
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            console.error('Error fetching data:', error);
            // Still success - data fetch might just be delayed
            setStatus('success');
            setMessage('Bank account connected! Data will sync shortly.');
            setTimeout(() => navigate('/'), 2000);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <div className="callback-icon" style={{ fontSize: '3rem' }}>
                    {status === 'loading' && '⏳'}
                    {status === 'success' && '✅'}
                    {status === 'error' && '❌'}
                </div>
                <h2 style={{ color: '#fff', marginTop: '20px' }}>
                    {status === 'loading' && 'Processing...'}
                    {status === 'success' && 'Success!'}
                    {status === 'error' && 'Oops!'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '12px' }}>
                    {message}
                </p>
                {status !== 'loading' && (
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '20px', fontSize: '0.85rem' }}>
                        Redirecting to dashboard...
                    </p>
                )}
            </div>
        </div>
    );
}
