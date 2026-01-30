import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Background Blobs */}
            <div className="blob blob-top"></div>
            <div className="blob blob-bottom"></div>

            <div className="auth-wrapper">
                <div className="glass-panel">
                    <div className="auth-header">
                        <div className="logo-container"></div>
                        <h1 className="auth-title">Institutional Access</h1>
                        <p className="auth-subtitle">Sign in to your enterprise account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Username</label>
                            <div className="input-wrapper">
                                <span className="material-symbols-outlined input-icon">person</span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    className="auth-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <span className="material-symbols-outlined input-icon">lock</span>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="auth-input"
                                />
                            </div>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button type="submit" className="btn-liquid" disabled={loading}>
                            <span>{loading ? 'Authenticating...' : 'Execute Login'}</span>
                            <span className="material-symbols-outlined btn-icon">arrow_forward</span>
                        </button>
                    </form>

                    <div className="auth-links">
                        <a href="#">Forgot Password?</a>
                        <a href="#">Request Access</a>
                    </div>
                </div>

                <div className="secure-badge-container">
                    <div className="secure-badge">
                        <span className="material-symbols-outlined">shield_lock</span>
                        <span>Secure Institutional Gateway 2.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
