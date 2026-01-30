import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SpendingChart.css';

interface Transaction {
    txn_date: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
}

interface SpendingChartProps {
    transactions: Transaction[];
}

export function SpendingChart({ transactions }: SpendingChartProps) {
    // Group transactions by month and calculate spending
    const monthlyData = transactions.reduce((acc, txn) => {
        const date = new Date(txn.txn_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!acc[monthKey]) {
            acc[monthKey] = { month: monthKey, spending: 0, income: 0 };
        }

        if (txn.type === 'DEBIT') {
            acc[monthKey].spending += txn.amount;
        } else {
            acc[monthKey].income += txn.amount;
        }

        return acc;
    }, {} as Record<string, { month: string; spending: number; income: number }>);

    const chartData = Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12) // Last 12 months
        .map(item => ({
            ...item,
            month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        }));

    // Demo data if no transactions
    const demoData = [
        { month: 'Aug 24', spending: 45000, income: 120000 },
        { month: 'Sep 24', spending: 52000, income: 135000 },
        { month: 'Oct 24', spending: 48000, income: 128000 },
        { month: 'Nov 24', spending: 61000, income: 142000 },
        { month: 'Dec 24', spending: 72000, income: 165000 },
        { month: 'Jan 25', spending: 55000, income: 138000 },
    ];

    const data = chartData.length > 0 ? chartData : demoData;

    return (
        <div className="spending-chart">
            <div className="chart-header">
                <h3>Cash Flow Overview</h3>
                <div className="chart-legend">
                    <span className="legend-item income">
                        <span className="dot"></span> Income
                    </span>
                    <span className="legend-item spending">
                        <span className="dot"></span> Spending
                    </span>
                </div>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="month"
                            stroke="rgba(255,255,255,0.5)"
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            fontSize={12}
                            tickLine={false}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(26, 26, 46, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                        />
                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#incomeGradient)"
                        />
                        <Area
                            type="monotone"
                            dataKey="spending"
                            stroke="#f43f5e"
                            strokeWidth={2}
                            fill="url(#spendingGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
