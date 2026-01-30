import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// Realistic SMB transaction categories and descriptions
const transactionTemplates = {
    CREDIT: [
        { narration: 'Payment received - Invoice #INV-2024-{num}', mode: 'NEFT', category: 'Sales' },
        { narration: 'UPI Payment from Customer', mode: 'UPI', category: 'Sales' },
        { narration: 'IMPS Transfer - Order Payment', mode: 'IMPS', category: 'Sales' },
        { narration: 'Razorpay Settlement', mode: 'NEFT', category: 'Payment Gateway' },
        { narration: 'GST Refund - {quarter}', mode: 'NEFT', category: 'Tax Refund' },
        { narration: 'Interest Credit', mode: 'SYSTEM', category: 'Interest' },
        { narration: 'Client Advance Payment', mode: 'UPI', category: 'Sales' },
        { narration: 'Marketplace Payout - Amazon/Flipkart', mode: 'NEFT', category: 'Sales' },
    ],
    DEBIT: [
        { narration: 'Vendor Payment - Raw Materials', mode: 'NEFT', category: 'Inventory' },
        { narration: 'Electricity Bill - {provider}', mode: 'NACH', category: 'Utilities' },
        { narration: 'Staff Salary - {month}', mode: 'NEFT', category: 'Payroll' },
        { narration: 'Rent Payment - Office/Warehouse', mode: 'NEFT', category: 'Rent' },
        { narration: 'GST Payment - {quarter}', mode: 'NEFT', category: 'Tax' },
        { narration: 'UPI Payment - Petty Cash', mode: 'UPI', category: 'Operations' },
        { narration: 'EMI - Business Loan', mode: 'NACH', category: 'Loan' },
        { narration: 'Internet & Phone Bill', mode: 'NACH', category: 'Utilities' },
        { narration: 'Supplier Payment - Packaging', mode: 'IMPS', category: 'Inventory' },
        { narration: 'Marketing - Google/Meta Ads', mode: 'Card', category: 'Marketing' },
        { narration: 'Software Subscription - Tally/Zoho', mode: 'Card', category: 'Software' },
        { narration: 'Courier & Logistics', mode: 'UPI', category: 'Shipping' },
        { narration: 'Office Supplies', mode: 'Card', category: 'Operations' },
    ],
};

const providers = ['BESCOM', 'MSEDCL', 'TATA Power', 'CESC'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const quarters = ['Q1 FY25', 'Q2 FY25', 'Q3 FY25', 'Q4 FY25'];

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTransactionNarration(template: { narration: string; mode: string; category: string }): { narration: string; mode: string; category: string } {
    let narration = template.narration;
    narration = narration.replace('{num}', String(randomBetween(1000, 9999)));
    narration = narration.replace('{provider}', providers[randomBetween(0, providers.length - 1)]);
    narration = narration.replace('{month}', months[randomBetween(0, 11)]);
    narration = narration.replace('{quarter}', quarters[randomBetween(0, 3)]);
    return { ...template, narration };
}

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    // 1. Get the first user from the profiles table
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
        console.error('❌ No user found in profiles table. Please register a user first!');
        console.log('   Go to https://localhost:5173/register and create an account.');
        process.exit(1);
    }

    const userId = profiles[0].id;
    console.log(`📋 Found user: ${profiles[0].business_name} (${profiles[0].email})`);
    console.log(`   User ID: ${userId}\n`);

    // 2. Create a mock consent record
    console.log('📝 Creating mock consent...');
    const { data: consent, error: consentError } = await supabase
        .from('consents')
        .insert({
            user_id: userId,
            consent_id: `MOCK-CONSENT-${Date.now()}`,
            status: 'APPROVED',
            consent_start: new Date().toISOString(),
            consent_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

    if (consentError) {
        console.error('❌ Error creating consent:', consentError);
        process.exit(1);
    }
    console.log(`   ✅ Consent created: ${consent.id}\n`);

    // 3. Create realistic bank accounts
    console.log('🏦 Creating bank accounts...');
    const accountsData = [
        {
            user_id: userId,
            consent_id: consent.id,
            fip_id: 'HDFC-FIP',
            fip_name: 'HDFC Bank',
            account_type: 'SAVINGS',
            masked_account_number: 'XXXX4521',
            balance: 485000.50,
            currency: 'INR',
            last_synced_at: new Date().toISOString(),
        },
        {
            user_id: userId,
            consent_id: consent.id,
            fip_id: 'ICICI-FIP',
            fip_name: 'ICICI Bank',
            account_type: 'CURRENT',
            masked_account_number: 'XXXX7832',
            balance: 1250000.00,
            currency: 'INR',
            last_synced_at: new Date().toISOString(),
        },
        {
            user_id: userId,
            consent_id: consent.id,
            fip_id: 'SBI-FIP',
            fip_name: 'State Bank of India',
            account_type: 'CURRENT',
            masked_account_number: 'XXXX2198',
            balance: 328500.75,
            currency: 'INR',
            last_synced_at: new Date().toISOString(),
        },
    ];

    const { data: accounts, error: accountError } = await supabase
        .from('accounts')
        .insert(accountsData)
        .select();

    if (accountError) {
        console.error('❌ Error creating accounts:', accountError);
        process.exit(1);
    }
    console.log(`   ✅ Created ${accounts.length} bank accounts\n`);

    // 4. Generate realistic transactions for the past 6 months
    console.log('💸 Generating transactions...');
    const transactions: any[] = [];
    const now = new Date();

    // Generate ~100 transactions spread over 6 months
    for (let i = 0; i < 100; i++) {
        const daysAgo = randomBetween(1, 180);
        const txnDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        // 60% credits, 40% debits (healthy cash flow)
        const isCredit = Math.random() < 0.45;
        const type = isCredit ? 'CREDIT' : 'DEBIT';
        const templates = transactionTemplates[type];
        const template = generateTransactionNarration(templates[randomBetween(0, templates.length - 1)]);

        // Realistic amounts based on category
        let amount: number;
        if (template.category === 'Sales') {
            amount = randomBetween(5000, 150000);
        } else if (template.category === 'Payroll') {
            amount = randomBetween(25000, 75000);
        } else if (template.category === 'Rent') {
            amount = randomBetween(30000, 80000);
        } else if (template.category === 'Tax') {
            amount = randomBetween(15000, 100000);
        } else if (template.category === 'Loan') {
            amount = randomBetween(20000, 50000);
        } else if (template.category === 'Inventory') {
            amount = randomBetween(10000, 80000);
        } else if (template.category === 'Payment Gateway') {
            amount = randomBetween(20000, 200000);
        } else {
            amount = randomBetween(500, 15000);
        }

        // Assign to a random account
        const account = accounts[randomBetween(0, accounts.length - 1)];

        transactions.push({
            account_id: account.id,
            user_id: userId,
            txn_id: `TXN-${Date.now()}-${i}`,
            amount,
            type,
            mode: template.mode,
            narration: template.narration,
            txn_date: txnDate.toISOString(),
            category: template.category,
            is_manual: false,
        });
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.txn_date).getTime() - new Date(a.txn_date).getTime());

    const { error: txnError } = await supabase
        .from('transactions')
        .insert(transactions);

    if (txnError) {
        console.error('❌ Error creating transactions:', txnError);
        process.exit(1);
    }

    console.log(`   ✅ Created ${transactions.length} transactions\n`);

    // Summary
    const totalCredits = transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = accountsData.reduce((sum, a) => sum + a.balance, 0);

    console.log('═══════════════════════════════════════════════');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════');
    console.log(`   Total Balance: ₹${totalBalance.toLocaleString('en-IN')}`);
    console.log(`   Total Credits (6 months): ₹${totalCredits.toLocaleString('en-IN')}`);
    console.log(`   Total Debits (6 months): ₹${totalDebits.toLocaleString('en-IN')}`);
    console.log('═══════════════════════════════════════════════\n');
    console.log('🚀 Refresh your dashboard to see the data!');
}

seedDatabase().catch(console.error);
