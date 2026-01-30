import './TransactionTable.css';

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

interface TransactionTableProps {
    transactions: Transaction[];
    limit?: number;
}

export function TransactionTable({ transactions, limit = 10 }: TransactionTableProps) {
    // Demo data if no transactions
    const demoTransactions: Transaction[] = [
        { id: '1', txn_id: 'TXN001', amount: 15000, type: 'CREDIT', mode: 'UPI', narration: 'Payment from Customer ABC', txn_date: '2025-01-28T10:30:00', category: 'Sales' },
        { id: '2', txn_id: 'TXN002', amount: 5200, type: 'DEBIT', mode: 'NEFT', narration: 'Supplier Payment - Raw Materials', txn_date: '2025-01-27T14:15:00', category: 'Inventory' },
        { id: '3', txn_id: 'TXN003', amount: 2500, type: 'DEBIT', mode: 'UPI', narration: 'Electricity Bill', txn_date: '2025-01-26T09:00:00', category: 'Utilities' },
        { id: '4', txn_id: 'TXN004', amount: 45000, type: 'CREDIT', mode: 'IMPS', narration: 'Invoice Payment - Order #1234', txn_date: '2025-01-25T16:45:00', category: 'Sales' },
        { id: '5', txn_id: 'TXN005', amount: 8500, type: 'DEBIT', mode: 'Card', narration: 'Office Supplies', txn_date: '2025-01-24T11:20:00', category: 'Operations' },
        { id: '6', txn_id: 'TXN006', amount: 3200, type: 'DEBIT', mode: 'UPI', narration: 'Staff Lunch', txn_date: '2025-01-23T13:00:00', category: 'Employee' },
    ];

    const displayTransactions = transactions.length > 0 ? transactions : demoTransactions;
    const limitedTransactions = displayTransactions.slice(0, limit);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="transaction-table">
            <div className="table-header">
                <h3>Recent Transactions</h3>
                <button className="view-all-btn">View All →</button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Mode</th>
                            <th>Date</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {limitedTransactions.map((txn) => (
                            <tr key={txn.id}>
                                <td>
                                    <div className="txn-description">
                                        <span className={`txn-icon ${txn.type.toLowerCase()}`}>
                                            {txn.type === 'CREDIT' ? '↓' : '↑'}
                                        </span>
                                        <div className="txn-details">
                                            <p className="txn-narration">{txn.narration}</p>
                                            {txn.category && <span className="txn-category">{txn.category}</span>}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="txn-mode">{txn.mode}</span>
                                </td>
                                <td>
                                    <span className="txn-date">{formatDate(txn.txn_date)}</span>
                                </td>
                                <td>
                                    <span className={`txn-amount ${txn.type.toLowerCase()}`}>
                                        {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
