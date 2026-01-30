import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Layout/Sidebar';
import { SpendingChart } from '../components/Dashboard/SpendingChart';
import { AccountCards } from '../components/Dashboard/AccountCards';
import { TransactionTable } from '../components/Dashboard/TransactionTable';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { createConsent } from '../lib/api';
import './Dashboard.css';

interface Account {
    id: string;
    fip_name: string;
    account_type: string;
    masked_account_number: string;
    balance: number;
    currency: string;
}

interface Transaction {
    id: string;
    txn_id: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    mode: string;
    narration: string;
    txn_date: string;
    category?: string;
}

export function Dashboard() {
    const { user, profile } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const { data: accountsData } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user?.id);

            if (accountsData) setAccounts(accountsData);

            const { data: transactionsData } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user?.id)
                .order('txn_date', { ascending: false });

            if (transactionsData) setTransactions(transactionsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectBank = async () => {
        if (!phoneNumber || phoneNumber.length !== 10) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }

        setConnecting(true);
        try {
            const redirectUrl = `${window.location.origin}/callback`;
            const response = await createConsent(user!.id, phoneNumber, redirectUrl);

            // Redirect to Setu consent screen
            window.location.href = response.redirectUrl;
        } catch (error) {
            console.error('Error creating consent:', error);
            alert('Failed to connect bank. Please try again.');
            setConnecting(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-content">
                        <h1>Welcome back, {profile?.business_name || 'Business'}!</h1>
                        <p>Here's your financial overview</p>
                    </div>
                    <button
                        className="connect-bank-btn"
                        onClick={() => setShowConnectModal(true)}
                    >
                        + Connect Bank Account
                    </button>
                </header>

                {/* Connect Bank Modal */}
                {showConnectModal && (
                    <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>Connect Your Bank Account</h3>
                            <p>Enter your phone number linked to your bank account</p>

                            <div className="modal-input-group">
                                <span className="phone-prefix">+91</span>
                                <input
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                />
                            </div>

                            <p className="modal-note">
                                You'll be redirected to securely approve data sharing via Account Aggregator
                            </p>

                            <div className="modal-actions">
                                <button
                                    className="modal-cancel"
                                    onClick={() => setShowConnectModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="modal-submit"
                                    onClick={handleConnectBank}
                                    disabled={connecting || phoneNumber.length !== 10}
                                >
                                    {connecting ? 'Connecting...' : 'Connect'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading your financial data...</p>
                    </div>
                ) : (
                    <div className="dashboard-content">
                        <section className="dashboard-section accounts-section">
                            <AccountCards accounts={accounts} />
                        </section>

                        <section className="dashboard-section chart-section">
                            <SpendingChart transactions={transactions} />
                        </section>

                        <section className="dashboard-section transactions-section">
                            <TransactionTable transactions={transactions} />
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
