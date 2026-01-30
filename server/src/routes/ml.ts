import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// ML Service URL (internal communication)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Proxy helper
async function proxyToML(endpoint: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', data?: any) {
    try {
        const url = `${ML_SERVICE_URL}${endpoint}`;
        const response = await axios({
            method,
            url,
            data,
            timeout: 60000, // 60 second timeout for ML operations
        });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw {
                status: error.response.status,
                message: error.response.data?.detail || error.response.data || 'ML service error'
            };
        }
        throw {
            status: 503,
            message: 'ML service unavailable'
        };
    }
}

/**
 * GET /api/ml/health
 * Check ML service health
 */
router.get('/health', async (req: Request, res: Response) => {
    try {
        const result = await proxyToML('/health');
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/ml/metrics/:userId
 * Get business metrics for a user
 */
router.get('/metrics/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const forceRefresh = req.query.force_refresh === 'true';
        
        const endpoint = `/api/ml/metrics/${userId}?force_refresh=${forceRefresh}`;
        const result = await proxyToML(endpoint);
        
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/ml/forecast/:userId
 * Get cash flow forecast for a user
 */
router.get('/forecast/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const forceRefresh = req.query.force_refresh === 'true';
        const months = req.query.months;
        
        let endpoint = `/api/ml/forecast/${userId}?force_refresh=${forceRefresh}`;
        if (months) {
            endpoint += `&months=${months}`;
        }
        
        const result = await proxyToML(endpoint);
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/ml/recurring/:userId
 * Get detected recurring transactions
 */
router.get('/recurring/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const result = await proxyToML(`/api/ml/recurring/${userId}`);
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * POST /api/ml/recurring/:userId/detect
 * Trigger recurring transaction detection
 */
router.post('/recurring/:userId/detect', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const result = await proxyToML(`/api/ml/recurring/${userId}/detect`, 'POST');
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * POST /api/ml/analyze/:userId
 * Run full analysis (recurring detection + metrics + forecast)
 */
router.post('/analyze/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const result = await proxyToML(`/api/ml/analyze/${userId}`, 'POST');
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * POST /api/ml/snapshots/:userId
 * Capture balance snapshot
 */
router.post('/snapshots/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const source = req.query.source || 'manual';
        const result = await proxyToML(`/api/ml/snapshots/${userId}?source=${source}`, 'POST');
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/ml/snapshots/:userId
 * Get balance history
 */
router.get('/snapshots/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const days = req.query.days || 90;
        const result = await proxyToML(`/api/ml/snapshots/${userId}?days=${days}`);
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * POST /api/ml/forecast/:userId/retrain
 * Force retrain forecast model
 */
router.post('/forecast/:userId/retrain', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const result = await proxyToML(`/api/ml/forecast/${userId}/retrain`, 'POST');
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * POST /api/ml/chat/:userId
 * Send a chat message to the financial advisor
 */
router.post('/chat/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { message, session_id } = req.body;
        
        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }
        
        const result = await proxyToML(`/api/ml/chat/${userId}`, 'POST', {
            message,
            session_id
        });
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * DELETE /api/ml/chat/:userId/session/:sessionId
 * Clear a chat session
 */
router.delete('/chat/:userId/session/:sessionId', async (req: Request, res: Response) => {
    try {
        const { userId, sessionId } = req.params;
        const result = await proxyToML(`/api/ml/chat/${userId}/session/${sessionId}`, 'DELETE');
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/ml/chat/:userId/session/:sessionId/history
 * Get chat history for a session
 */
router.get('/chat/:userId/session/:sessionId/history', async (req: Request, res: Response) => {
    try {
        const { userId, sessionId } = req.params;
        const result = await proxyToML(`/api/ml/chat/${userId}/session/${sessionId}/history`);
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/ml/chat/health
 * Check chat service health
 */
router.get('/chat/health', async (req: Request, res: Response) => {
    try {
        const result = await proxyToML('/api/ml/chat/health');
        res.json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

export default router;
