import { Router, Request, Response } from 'express';
import { setuService } from '../services/setu';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /api/consent/create
 * Create a new consent request for a user
 */
router.post('/create', async (req: Request, res: Response) => {
    try {
        const { userId, phoneNumber, redirectUrl } = req.body;

        if (!userId || !phoneNumber || !redirectUrl) {
            return res.status(400).json({
                error: 'Missing required fields: userId, phoneNumber, redirectUrl',
            });
        }

        // Create consent with Setu
        const setuResponse = await setuService.createConsent({
            phoneNumber,
            redirectUrl,
        });

        // Store consent record in database
        const { data: consent, error } = await supabase
            .from('consents')
            .insert({
                user_id: userId,
                consent_id: setuResponse.id,
                status: setuResponse.status,
                redirect_url: setuResponse.url,
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to store consent' });
        }

        return res.json({
            consentId: setuResponse.id,
            redirectUrl: setuResponse.url,
            status: setuResponse.status,
        });
    } catch (error) {
        console.error('Error creating consent:', error);
        return res.status(500).json({ error: 'Failed to create consent' });
    }
});

/**
 * GET /api/consent/:consentId/status
 * Check the status of a consent request
 */
router.get('/:consentId/status', async (req: Request, res: Response) => {
    try {
        const { consentId } = req.params;

        const setuResponse = await setuService.getConsentStatus(consentId);

        // Update status in database
        await supabase
            .from('consents')
            .update({ status: setuResponse.status })
            .eq('consent_id', consentId);

        return res.json({ status: setuResponse.status });
    } catch (error) {
        console.error('Error getting consent status:', error);
        return res.status(500).json({ error: 'Failed to get consent status' });
    }
});

/**
 * POST /api/consent/:consentId/fetch-data
 * Fetch financial data for an approved consent
 */
router.post('/:consentId/fetch-data', async (req: Request, res: Response) => {
    try {
        const { consentId } = req.params;

        // Get consent from database to find user_id
        const { data: consent, error: consentError } = await supabase
            .from('consents')
            .select('*')
            .eq('consent_id', consentId)
            .single();

        if (consentError || !consent) {
            return res.status(404).json({ error: 'Consent not found' });
        }

        // Create data session
        const session = await setuService.createDataSession(consentId);

        // Fetch financial data
        const financialData = await setuService.fetchData(session.id);

        // Store accounts
        for (const account of financialData.accounts) {
            const { data: accountData, error: accountError } = await supabase
                .from('accounts')
                .upsert({
                    user_id: consent.user_id,
                    consent_id: consent.id,
                    fip_id: account.fipId,
                    fip_name: account.fipName,
                    account_type: account.type,
                    masked_account_number: account.maskedAccNumber,
                    balance: account.balance?.current || 0,
                    currency: account.balance?.currency || 'INR',
                    last_synced_at: new Date().toISOString(),
                }, {
                    onConflict: 'masked_account_number',
                })
                .select()
                .single();

            if (accountError) {
                console.error('Error storing account:', accountError);
                continue;
            }

            // Store transactions for this account
            if (accountData) {
                const transactionsToInsert = financialData.transactions.map((txn) => ({
                    account_id: accountData.id,
                    user_id: consent.user_id,
                    txn_id: txn.txnId,
                    amount: txn.amount,
                    type: txn.type,
                    mode: txn.mode,
                    narration: txn.narration,
                    txn_date: txn.transactionTimestamp,
                }));

                if (transactionsToInsert.length > 0) {
                    const { error: txnError } = await supabase
                        .from('transactions')
                        .upsert(transactionsToInsert, {
                            onConflict: 'txn_id',
                        });

                    if (txnError) {
                        console.error('Error storing transactions:', txnError);
                    }
                }
            }
        }

        return res.json({
            message: 'Data fetched and stored successfully',
            accountsCount: financialData.accounts.length,
            transactionsCount: financialData.transactions.length,
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
});

export default router;
