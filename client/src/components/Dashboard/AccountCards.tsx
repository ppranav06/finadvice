import './AccountCards.css';

interface Account {
    id: string;
    fip_name: string;
    account_type: string;
    masked_account_number: string;
    balance: number;
    currency: string;
}

interface AccountCardsProps {
    accounts: Account[];
}

export function AccountCards({ accounts }: AccountCardsProps) {
    // Demo data if no accounts
    const demoAccounts: Account[] = [
        { id: '1', fip_name: 'HDFC Bank', account_type: 'SAVINGS', masked_account_number: 'XXXX1234', balance: 245000, currency: 'INR' },
        { id: '2', fip_name: 'ICICI Bank', account_type: 'CURRENT', masked_account_number: 'XXXX5678', balance: 892000, currency: 'INR' },
    ];

    const displayAccounts = accounts.length > 0 ? accounts : demoAccounts;
    const totalBalance = displayAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <div className="account-cards">
            <div className="total-balance-card">
                <div className="card-icon">💰</div>
                <div className="card-content">
                    <p className="card-label">Total Balance</p>
                    <h2 className="card-value">₹{totalBalance.toLocaleString()}</h2>
                </div>
                <div className="card-badge">
                    <span className="accounts-count">{displayAccounts.length} Accounts</span>
                </div>
            </div>

            <div className="accounts-grid">
                {displayAccounts.map((account) => (
                    <div key={account.id} className="account-card">
                        <div className="account-header">
                            <span className="bank-icon">🏦</span>
                            <span className="bank-name">{account.fip_name}</span>
                        </div>
                        <div className="account-details">
                            <p className="account-number">{account.masked_account_number}</p>
                            <p className="account-type">{account.account_type}</p>
                        </div>
                        <div className="account-balance">
                            <p className="balance-label">Balance</p>
                            <p className="balance-value">₹{account.balance.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
