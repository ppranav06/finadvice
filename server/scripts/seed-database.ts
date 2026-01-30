import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// Configuration
const MONTHS_OF_DATA = 12; // Generate 12 months of transaction history
const TARGET_TRANSACTION_COUNT = 800; // ~66 transactions per month

// Realistic SMB transaction categories and descriptions
// Split into RECURRING (predictable patterns) and ONE_TIME (variable)
const recurringTransactionTemplates = {
    DEBIT: [
        { narration: 'Rent Payment - Office Space', mode: 'NEFT', category: 'Rent', amount: 65000, frequencyDays: 30 },
        { narration: 'Staff Salary - Monthly Payroll', mode: 'NEFT', category: 'Payroll', amount: 150000, frequencyDays: 30 },
        { narration: 'EMI - Business Loan HDFC', mode: 'NACH', category: 'Loan', amount: 45000, frequencyDays: 30 },
        { narration: 'Internet & Phone Bill - Airtel', mode: 'NACH', category: 'Utilities', amount: 4500, frequencyDays: 30 },
        { narration: 'Software Subscription - Zoho One', mode: 'Card', category: 'Software', amount: 12000, frequencyDays: 30 },
        { narration: 'AWS Cloud Services', mode: 'Card', category: 'Software', amount: 25000, frequencyDays: 30 },
        { narration: 'Electricity Bill - {provider}', mode: 'NACH', category: 'Utilities', amount: 18000, frequencyDays: 30 },
        { narration: 'GST Payment - {quarter}', mode: 'NEFT', category: 'Tax', amount: 85000, frequencyDays: 90 },
        { narration: 'Insurance Premium - Fire & Theft', mode: 'NACH', category: 'Operations', amount: 35000, frequencyDays: 90 },
    ],
};

const oneTimeTransactionTemplates = {
    CREDIT: [
        { narration: 'Payment received - Invoice #INV-{year}-{num}', mode: 'NEFT', category: 'Sales', minAmount: 15000, maxAmount: 250000 },
        { narration: 'UPI Payment from Customer', mode: 'UPI', category: 'Sales', minAmount: 2000, maxAmount: 50000 },
        { narration: 'IMPS Transfer - Order Payment', mode: 'IMPS', category: 'Sales', minAmount: 5000, maxAmount: 100000 },
        { narration: 'Razorpay Settlement - Daily', mode: 'NEFT', category: 'Payment Gateway', minAmount: 10000, maxAmount: 150000 },
        { narration: 'GST Refund - {quarter}', mode: 'NEFT', category: 'Tax Refund', minAmount: 25000, maxAmount: 75000 },
        { narration: 'Interest Credit - Savings', mode: 'SYSTEM', category: 'Interest', minAmount: 500, maxAmount: 5000 },
        { narration: 'Client Advance Payment', mode: 'UPI', category: 'Sales', minAmount: 20000, maxAmount: 100000 },
        { narration: 'Marketplace Payout - Amazon', mode: 'NEFT', category: 'Sales', minAmount: 30000, maxAmount: 200000 },
        { narration: 'Marketplace Payout - Flipkart', mode: 'NEFT', category: 'Sales', minAmount: 20000, maxAmount: 150000 },
        { narration: 'Contract Payment - Project Milestone', mode: 'NEFT', category: 'Sales', minAmount: 50000, maxAmount: 300000 },
    ],
    DEBIT: [
        { narration: 'Vendor Payment - Raw Materials', mode: 'NEFT', category: 'Inventory', minAmount: 15000, maxAmount: 120000 },
        { narration: 'UPI Payment - Petty Cash', mode: 'UPI', category: 'Operations', minAmount: 500, maxAmount: 5000 },
        { narration: 'Supplier Payment - Packaging', mode: 'IMPS', category: 'Inventory', minAmount: 8000, maxAmount: 40000 },
        { narration: 'Marketing - Google Ads', mode: 'Card', category: 'Marketing', minAmount: 5000, maxAmount: 50000 },
        { narration: 'Marketing - Meta Ads', mode: 'Card', category: 'Marketing', minAmount: 3000, maxAmount: 30000 },
        { narration: 'Courier & Logistics - Delhivery', mode: 'UPI', category: 'Shipping', minAmount: 2000, maxAmount: 25000 },
        { narration: 'Office Supplies - Amazon Business', mode: 'Card', category: 'Operations', minAmount: 1000, maxAmount: 15000 },
        { narration: 'Equipment Maintenance', mode: 'NEFT', category: 'Operations', minAmount: 5000, maxAmount: 30000 },
        { narration: 'Travel - Business Trip', mode: 'Card', category: 'Operations', minAmount: 10000, maxAmount: 50000 },
        { narration: 'Professional Services - CA Fees', mode: 'NEFT', category: 'Operations', minAmount: 15000, maxAmount: 40000 },
        { narration: 'Freelancer Payment', mode: 'UPI', category: 'Payroll', minAmount: 10000, maxAmount: 50000 },
    ],
};

const providers = ['BESCOM', 'MSEDCL', 'TATA Power', 'CESC'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const quarters = ['Q1 FY25', 'Q2 FY25', 'Q3 FY25', 'Q4 FY26'];

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Add some variance to recurring amounts (±5%)
function varyAmount(baseAmount: number): number {
    const variance = baseAmount * 0.05;
    return baseAmount + (Math.random() * variance * 2 - variance);
}

function generateOneTimeNarration(template: { narration: string; mode: string; category: string; minAmount: number; maxAmount: number }, date: Date): { narration: string; mode: string; category: string; amount: number } {
    let narration = template.narration;
    narration = narration.replace('{num}', String(randomBetween(1000, 9999)));
    narration = narration.replace('{year}', String(date.getFullYear()));
    narration = narration.replace('{provider}', providers[randomBetween(0, providers.length - 1)]);
    narration = narration.replace('{month}', months[date.getMonth()]);
    narration = narration.replace('{quarter}', quarters[randomBetween(0, 3)]);
    
    // Add some seasonality - higher sales in certain months
    let amount = randomBetween(template.minAmount, template.maxAmount);
    const month = date.getMonth();
    // Q4 (Oct-Dec) and Q1 (Jan-Mar) typically see higher sales
    if (month >= 9 || month <= 2) {
        amount = Math.round(amount * 1.2);
    }
    // Summer slowdown (Apr-Jun)
    if (month >= 3 && month <= 5) {
        amount = Math.round(amount * 0.85);
    }
    
    return { narration, mode: template.mode, category: template.category, amount };
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

    // 4. Generate recurring transactions (predictable patterns)
    console.log('💸 Generating recurring transactions...');
    const transactions: any[] = [];
    const now = new Date();
    const startDate = new Date(now.getTime() - MONTHS_OF_DATA * 30 * 24 * 60 * 60 * 1000);

    // Generate recurring DEBIT transactions
    for (const template of recurringTransactionTemplates.DEBIT) {
        let currentDate = new Date(startDate);
        
        // Align to roughly the same day each month/quarter
        const dayOfMonth = randomBetween(1, 10); // Recurring payments usually early in month
        currentDate.setDate(dayOfMonth);
        
        while (currentDate < now) {
            const account = accounts[randomBetween(0, accounts.length - 1)];
            let narration = template.narration;
            narration = narration.replace('{provider}', providers[randomBetween(0, providers.length - 1)]);
            narration = narration.replace('{quarter}', `Q${Math.floor(currentDate.getMonth() / 3) + 1} FY${currentDate.getFullYear() % 100}`);
            
            transactions.push({
                account_id: account.id,
                user_id: userId,
                txn_id: `TXN-REC-${Date.now()}-${transactions.length}`,
                amount: Math.round(varyAmount(template.amount)),
                type: 'DEBIT',
                mode: template.mode,
                narration,
                txn_date: new Date(currentDate).toISOString(),
                category: template.category,
                is_manual: false,
            });
            
            // Move to next occurrence
            currentDate.setDate(currentDate.getDate() + template.frequencyDays);
        }
    }
    
    console.log(`   ✅ Generated ${transactions.length} recurring transactions`);

    // 5. Generate one-time/variable transactions
    console.log('💸 Generating one-time transactions...');
    const oneTimeCount = TARGET_TRANSACTION_COUNT - transactions.length;
    
    for (let i = 0; i < oneTimeCount; i++) {
        const daysAgo = randomBetween(1, MONTHS_OF_DATA * 30);
        const txnDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        // 55% credits, 45% debits (slightly profitable)
        const isCredit = Math.random() < 0.55;
        const type = isCredit ? 'CREDIT' : 'DEBIT';
        const templates = oneTimeTransactionTemplates[type];
        const template = templates[randomBetween(0, templates.length - 1)];
        const generated = generateOneTimeNarration(template, txnDate);
        
        const account = accounts[randomBetween(0, accounts.length - 1)];
        
        transactions.push({
            account_id: account.id,
            user_id: userId,
            txn_id: `TXN-${Date.now()}-${transactions.length}`,
            amount: generated.amount,
            type,
            mode: generated.mode,
            narration: generated.narration,
            txn_date: txnDate.toISOString(),
            category: generated.category,
            is_manual: false,
        });
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.txn_date).getTime() - new Date(a.txn_date).getTime());

    // Insert in batches to avoid timeout
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        const { error: txnError } = await supabase
            .from('transactions')
            .insert(batch);

        if (txnError) {
            console.error(`❌ Error creating transactions batch ${i / batchSize + 1}:`, txnError);
            process.exit(1);
        }
    }

    console.log(`   ✅ Created ${transactions.length} total transactions\n`);

    // 6. Create initial balance snapshots
    console.log('📸 Creating balance snapshots...');
    const snapshots: any[] = [];
    
    // Create daily snapshots for the last 30 days
    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
        const snapshotDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const dateStr = snapshotDate.toISOString().split('T')[0];
        
        for (const account of accounts) {
            // Simulate balance variation over time (±10% from current)
            const variance = account.balance * 0.1 * (Math.random() - 0.5);
            const historicalBalance = account.balance + variance * (daysAgo / 30);
            
            snapshots.push({
                account_id: account.id,
                user_id: userId,
                balance: Math.round(historicalBalance * 100) / 100,
                snapshot_date: dateStr,
                source: 'seed',
            });
        }
    }

    // Insert snapshots (may fail if table doesn't exist yet, that's ok)
    try {
        for (const snapshot of snapshots) {
            await supabase
                .from('balance_snapshots')
                .upsert(snapshot, { onConflict: 'account_id,snapshot_date' });
        }
        console.log(`   ✅ Created ${snapshots.length} balance snapshots\n`);
    } catch (err) {
        console.log(`   ⚠️  Could not create balance snapshots (run migration 002_ml_tables.sql first)\n`);
    }

    // Summary
    const totalCredits = transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = accountsData.reduce((sum, a) => sum + a.balance, 0);
    const recurringCount = transactions.filter(t => t.txn_id.includes('REC')).length;

    console.log('═══════════════════════════════════════════════');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════');
    console.log(`   Period: ${MONTHS_OF_DATA} months of transaction history`);
    console.log(`   Total Balance: ₹${totalBalance.toLocaleString('en-IN')}`);
    console.log(`   Total Transactions: ${transactions.length}`);
    console.log(`   - Recurring: ${recurringCount}`);
    console.log(`   - One-time: ${transactions.length - recurringCount}`);
    console.log(`   Total Credits: ₹${totalCredits.toLocaleString('en-IN')}`);
    console.log(`   Total Debits: ₹${totalDebits.toLocaleString('en-IN')}`);
    console.log(`   Net Cash Flow: ₹${(totalCredits - totalDebits).toLocaleString('en-IN')}`);
    console.log('═══════════════════════════════════════════════\n');
    console.log('🚀 Next steps:');
    console.log('   1. Run migration: server/migrations/002_ml_tables.sql');
    console.log('   2. Start ML service: cd ml && uvicorn src.main:app --reload');
    console.log('   3. Trigger analysis: POST http://localhost:8000/api/ml/analyze/{user_id}');
    console.log(`   4. User ID: ${userId}`);
}

seedDatabase().catch(console.error);
