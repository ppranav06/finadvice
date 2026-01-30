import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Layout/Sidebar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Transactions.css';

// Predefined categories
const CATEGORIES = [
    'Sales',
    'Payroll',
    'Rent',
    'Utilities',
    'Inventory',
    'Marketing',
    'Tax',
    'Loan',
    'Operations',
    'Shipping',
    'Software',
    'Interest',
    'Other',
];

interface Transaction {
    id: string;
    txn_id: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    mode: string;
    narration: string;
    txn_date: string;
    category: string | null;
    is_manual: boolean;
}

export function Transactions() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'bank' | 'manual'>('bank');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    // Manual entry form state
    const [formData, setFormData] = useState({
        amount: '',
        type: 'DEBIT' as 'CREDIT' | 'DEBIT',
        category: 'Operations',
        narration: '',
        txn_date: new Date().toISOString().split('T')[0],
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user?.id)
                .order('txn_date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateCategory = async (txnId: string, newCategory: string) => {
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ category: newCategory })
                .eq('id', txnId);

            if (error) throw error;

            setTransactions(prev =>
                prev.map(txn =>
                    txn.id === txnId ? { ...txn, category: newCategory } : txn
                )
            );
            setEditingId(null);
        } catch (error) {
            console.error('Error updating category:', error);
            alert('Failed to update category');
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.narration) {
            alert('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('transactions').insert({
                user_id: user?.id,
                txn_id: `MANUAL-${Date.now()}`,
                amount: parseFloat(formData.amount),
                type: formData.type,
                mode: 'Manual Entry',
                narration: formData.narration,
                txn_date: formData.txn_date,
                category: formData.category,
                is_manual: true,
            });

            if (error) throw error;

            // Reset form
            setFormData({
                amount: '',
                type: 'DEBIT',
                category: 'Operations',
                narration: '',
                txn_date: new Date().toISOString().split('T')[0],
            });

            // Refresh transactions
            fetchTransactions();
            alert('Transaction added successfully!');
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Failed to add transaction');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Filter transactions
    const filteredTransactions = transactions.filter(txn => {
        // Filter by tab
        if (activeTab === 'manual' && !txn.is_manual) return false;
        if (activeTab === 'bank' && txn.is_manual) return false;

        // Filter by category
        if (filterCategory !== 'all' && txn.category !== filterCategory) return false;

        // Filter by type
        if (filterType !== 'all' && txn.type !== filterType) return false;

        return true;
    });

    // Calculate totals for filtered
    const totalCredits = filteredTransactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = filteredTransactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="transactions-layout">
            <Sidebar />
            <main className="transactions-main">
                <header className="transactions-header">
                    <h1>Transactions</h1>
                    <p>Manage your bank transactions and manual entries</p>
                </header>

                {/* Tabs */}
                <div className="transactions-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'bank' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bank')}
                    >
                        🏦 Bank Transactions
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                        onClick={() => setActiveTab('manual')}
                    >
                        ✏️ Manual Entries
                    </button>
                </div>

                {/* Manual Entry Form (shown when manual tab is active) */}
                {activeTab === 'manual' && (
                    <div className="manual-entry-section">
                        <div className="manual-form-card">
                            <h3>Add Manual Transaction</h3>
                            <form onSubmit={handleManualSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Type</label>
                                        <div className="type-toggle">
                                            <button
                                                type="button"
                                                className={`toggle-btn ${formData.type === 'DEBIT' ? 'active expense' : ''}`}
                                                onClick={() => setFormData(f => ({ ...f, type: 'DEBIT' }))}
                                            >
                                                ↑ Expense
                                            </button>
                                            <button
                                                type="button"
                                                className={`toggle-btn ${formData.type === 'CREDIT' ? 'active income' : ''}`}
                                                onClick={() => setFormData(f => ({ ...f, type: 'CREDIT' }))}
                                            >
                                                ↓ Income
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Amount (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Date</label>
                                        <input
                                            type="date"
                                            value={formData.txn_date}
                                            onChange={e => setFormData(f => ({ ...f, txn_date: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        placeholder="Enter transaction description"
                                        value={formData.narration}
                                        onChange={e => setFormData(f => ({ ...f, narration: e.target.value }))}
                                        required
                                    />
                                </div>

                                <button type="submit" className="submit-btn" disabled={submitting}>
                                    {submitting ? 'Adding...' : '+ Add Transaction'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="transactions-filters">
                    <div className="filter-group">
                        <label>Category:</label>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Type:</label>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="CREDIT">Income</option>
                            <option value="DEBIT">Expense</option>
                        </select>
                    </div>
                    <div className="filter-summary">
                        <span className="credit">↓ ₹{totalCredits.toLocaleString('en-IN')}</span>
                        <span className="debit">↑ ₹{totalDebits.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Transactions Table */}
                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading transactions...</p>
                    </div>
                ) : (
                    <div className="transactions-table-container">
                        <table className="transactions-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Mode</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="empty-state">
                                            {activeTab === 'manual'
                                                ? 'No manual entries yet. Add one above!'
                                                : 'No bank transactions found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map(txn => (
                                        <tr key={txn.id}>
                                            <td>
                                                <div className="txn-description">
                                                    <span className={`txn-icon ${txn.type.toLowerCase()}`}>
                                                        {txn.type === 'CREDIT' ? '↓' : '↑'}
                                                    </span>
                                                    <span className="txn-narration">{txn.narration}</span>
                                                    {txn.is_manual && <span className="manual-badge">Manual</span>}
                                                </div>
                                            </td>
                                            <td>
                                                {editingId === txn.id ? (
                                                    <select
                                                        value={txn.category || ''}
                                                        onChange={e => updateCategory(txn.id, e.target.value)}
                                                        onBlur={() => setEditingId(null)}
                                                        autoFocus
                                                    >
                                                        {CATEGORIES.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span
                                                        className="category-badge editable"
                                                        onClick={() => setEditingId(txn.id)}
                                                        title="Click to edit"
                                                    >
                                                        {txn.category || 'Uncategorized'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="txn-mode">{txn.mode}</span>
                                            </td>
                                            <td>
                                                <span className="txn-date">{formatDate(txn.txn_date)}</span>
                                            </td>
                                            <td>
                                                <span className={`txn-amount ${txn.type.toLowerCase()}`}>
                                                    {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
