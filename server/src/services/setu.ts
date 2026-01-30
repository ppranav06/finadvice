import axios, { AxiosInstance } from 'axios';

interface ConsentRequest {
    phoneNumber: string;
    redirectUrl: string;
}

interface ConsentResponse {
    id: string;
    url: string;
    status: string;
}

interface DataSessionResponse {
    id: string;
    status: string;
    format: string;
}

interface FinancialData {
    accounts: Account[];
    transactions: Transaction[];
}

interface Account {
    maskedAccNumber: string;
    type: string;
    fiType: string;
    fipId: string;
    fipName: string;
    balance?: {
        current: number;
        currency: string;
    };
}

interface Transaction {
    txnId: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    mode: string;
    narration: string;
    transactionTimestamp: string;
}

export class SetuService {
    private client: AxiosInstance;

    constructor() {
        const baseURL = process.env.SETU_BASE_URL || 'https://fiu-uat.setu.co';

        this.client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include auth headers from env (loaded at request time)
        this.client.interceptors.request.use((config) => {
            config.headers['x-client-id'] = process.env.SETU_CLIENT_ID;
            config.headers['x-client-secret'] = process.env.SETU_CLIENT_SECRET;
            config.headers['x-product-instance-id'] = process.env.SETU_PRODUCT_INSTANCE_ID;
            return config;
        });
    }

    /**
     * Create a consent request for a user
     * Returns a URL where the user can approve the consent
     */
    async createConsent(request: ConsentRequest): Promise<ConsentResponse> {
        const consentRequest = {
            Detail: {
                consentStart: new Date().toISOString(),
                consentExpiry: this.getConsentExpiry(),
                Customer: {
                    id: `${request.phoneNumber}@onemoney`, // Setu sandbox format
                },
                FIDataRange: {
                    from: this.getFiveYearsAgo(),
                    to: new Date().toISOString(),
                },
                consentMode: 'STORE',
                consentTypes: ['TRANSACTIONS', 'PROFILE', 'SUMMARY'],
                fetchType: 'PERIODIC',
                Frequency: {
                    value: 1,
                    unit: 'MONTH',
                },
                DataLife: {
                    value: 1,
                    unit: 'YEAR',
                },
                DataConsumer: {
                    id: 'setu-fiu-id', // Will be provided by Setu
                },
                Purpose: {
                    Category: {
                        type: 'Personal Finance',
                    },
                    code: '101',
                    text: 'Financial data analysis for business insights',
                    refUri: 'https://api.rebit.org.in/aa/purpose/101.xml',
                },
                fiTypes: ['DEPOSIT'],
            },
            redirectUrl: request.redirectUrl,
        };

        try {
            const response = await this.client.post('/consents', consentRequest);
            return {
                id: response.data.id,
                url: response.data.url,
                status: response.data.status,
            };
        } catch (error) {
            console.error('Error creating consent:', error);
            throw error;
        }
    }

    /**
     * Get the status of a consent request
     */
    async getConsentStatus(consentId: string): Promise<{ status: string }> {
        try {
            const response = await this.client.get(`/consents/${consentId}`);
            return { status: response.data.status };
        } catch (error) {
            console.error('Error getting consent status:', error);
            throw error;
        }
    }

    /**
     * Create a data session to fetch financial data after consent is approved
     */
    async createDataSession(consentId: string): Promise<DataSessionResponse> {
        const sessionRequest = {
            consentId,
            DataRange: {
                from: this.getFiveYearsAgo(),
                to: new Date().toISOString(),
            },
            format: 'json',
        };

        try {
            const response = await this.client.post('/sessions', sessionRequest);
            return {
                id: response.data.id,
                status: response.data.status,
                format: response.data.format,
            };
        } catch (error) {
            console.error('Error creating data session:', error);
            throw error;
        }
    }

    /**
     * Fetch financial data for a session
     */
    async fetchData(sessionId: string): Promise<FinancialData> {
        try {
            const response = await this.client.get(`/sessions/${sessionId}`);

            // Parse the response and extract accounts and transactions
            const fiData = response.data.Payload || [];
            const accounts: Account[] = [];
            const transactions: Transaction[] = [];

            for (const payload of fiData) {
                if (payload.data?.account) {
                    for (const account of payload.data.account) {
                        accounts.push({
                            maskedAccNumber: account.maskedAccNumber || '',
                            type: account.type || '',
                            fiType: payload.fiType || '',
                            fipId: payload.fipId || '',
                            fipName: payload.fipName || '',
                            balance: account.summary?.currentBalance
                                ? {
                                    current: parseFloat(account.summary.currentBalance),
                                    currency: account.summary.currency || 'INR',
                                }
                                : undefined,
                        });

                        // Extract transactions if available
                        if (account.transactions?.transaction) {
                            for (const txn of account.transactions.transaction) {
                                transactions.push({
                                    txnId: txn.txnId || '',
                                    amount: parseFloat(txn.amount || '0'),
                                    type: txn.type as 'CREDIT' | 'DEBIT',
                                    mode: txn.mode || '',
                                    narration: txn.narration || '',
                                    transactionTimestamp: txn.transactionTimestamp || '',
                                });
                            }
                        }
                    }
                }
            }

            return { accounts, transactions };
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    private getConsentExpiry(): string {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        return expiry.toISOString();
    }

    private getFiveYearsAgo(): string {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 5);
        return date.toISOString();
    }
}

export const setuService = new SetuService();
