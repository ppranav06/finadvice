import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { setuService } from '../services/setu';

const router = Router();

interface SetuNotification {
    type: string;
    timestamp: string;
    consentId?: string;
    sessionId?: string;
    consentStatus?: string;
    dataStatus?: string;
}

/**
 * POST /api/webhooks/setu
 * Handle notifications from Setu AA
 * 
 * Two types of notifications:
 * 1. Consent notifications - when user approves/rejects consent
 * 2. FI notifications - when financial data is ready to fetch
 */
router.post('/setu', async (req: Request, res: Response) => {
    try {
        const notification: SetuNotification = req.body;

        console.log('Received Setu notification:', JSON.stringify(notification, null, 2));

        // Handle consent status update
        if (notification.consentId && notification.consentStatus) {
            const { error } = await supabase
                .from('consents')
                .update({
                    status: notification.consentStatus,
                    consent_start: notification.consentStatus === 'APPROVED' ? new Date().toISOString() : null,
                })
                .eq('consent_id', notification.consentId);

            if (error) {
                console.error('Error updating consent status:', error);
            } else {
                console.log(`Consent ${notification.consentId} updated to ${notification.consentStatus}`);
            }

            // If consent is approved, automatically fetch the data
            if (notification.consentStatus === 'APPROVED') {
                try {
                    // Get consent to find user_id
                    const { data: consent } = await supabase
                        .from('consents')
                        .select('*')
                        .eq('consent_id', notification.consentId)
                        .single();

                    if (consent) {
                        // Create data session and fetch data
                        const session = await setuService.createDataSession(notification.consentId);
                        console.log(`Data session created: ${session.id}`);

                        // Note: Data will be fetched when FI notification is received
                        // or can be fetched manually via /api/consent/:consentId/fetch-data
                    }
                } catch (fetchError) {
                    console.error('Error initiating data fetch:', fetchError);
                }
            }
        }

        // Handle FI data ready notification
        if (notification.sessionId && notification.dataStatus === 'READY') {
            console.log(`Data ready for session ${notification.sessionId}`);
            // The actual data fetch can be triggered here or via the consent route
        }

        // Acknowledge receipt
        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router;
