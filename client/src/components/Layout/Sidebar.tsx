import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export function Sidebar() {
    const { profile, signOut } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-logo">FinAdvice</h1>
                <p className="sidebar-subtitle">Smart Finance for SMBs</p>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">📊</span>
                    Dashboard
                </NavLink>
                <NavLink to="/accounts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🏦</span>
                    Accounts
                </NavLink>
                <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">💳</span>
                    Transactions
                </NavLink>
                <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">💬</span>
                    AI Advisor
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                {profile && (
                    <div className="user-info">
                        <p className="business-name">{profile.business_name}</p>
                        <p className="business-type">{profile.business_type}</p>
                    </div>
                )}
                <button className="sign-out-btn" onClick={signOut}>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
