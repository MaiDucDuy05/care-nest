import { PAYMENT_API, getToken } from '@/lib/api-client';

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface CreatePaymentInput {
  orderId: string;
  method: 'VNPAY' | 'MOMO' | 'COD' | 'BANK_TRANSFER' | 'ZALOPAY';
  amount: number;
  idempotencyKey?: string;
  returnUrl?: string;
}

export interface PaymentResult {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  status: string;
  transactionRef?: string;
  gatewayResponse?: {
    paymentUrl?: string;
    [key: string]: unknown;
  };
}

export const paymentService = {
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const payload = {
      orderId: input.orderId,
      method: input.method,
      amount: Math.round(input.amount),
      idempotencyKey: input.idempotencyKey || `${input.orderId}-pay-${Date.now()}`,
      returnUrl: input.returnUrl,
    };

    const res = await fetch(`${PAYMENT_API}/api/v1/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        errMsg = parsed.message || errText;
      } catch {
        // use raw errText
      }
      throw new Error(errMsg);
    }

    return res.json();
  },

  async getPayment(id: string): Promise<PaymentResult> {
    const res = await fetch(`${PAYMENT_API}/api/v1/payments/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
