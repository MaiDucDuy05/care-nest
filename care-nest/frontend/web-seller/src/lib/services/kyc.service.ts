import { CATALOG_API, apiFetch, getToken } from '../api-client';
import type { KYCApplication, KYCStatus } from '../types';

export interface KYCSubmitInput {
  businessName: string;
  taxId: string;
  businessAddress: string;
  businessType: string;
  businessPhone: string;
  licenseNumber: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
}

export const kycService = {
  async getStatus(): Promise<KYCStatus | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const seller = await apiFetch<{ kycStatus?: KYCStatus; status?: KYCStatus } | null>(
        `${CATALOG_API}/api/v1/kyc/me`,
        { token }
      );
      return seller?.kycStatus ?? seller?.status ?? null;
    } catch (err) {
      if ((err as { status?: number }).status === 404) return null;
      throw err;
    }
  },

  async submit(input: KYCSubmitInput, documentFiles: File[] = []): Promise<KYCApplication> {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    const form = new FormData();
    Object.entries(input).forEach(([k, v]) => form.append(k, v));
    documentFiles.forEach((f) => form.append('documents', f));

    let res = await fetch(`${CATALOG_API}/api/v1/seller/kyc`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (res.status === 404) {
      res = await fetch(`${CATALOG_API}/api/v1/kyc/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    }

    if (res.status === 404) {
      res = await fetch(`${CATALOG_API}/api/v1/kyc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    }

    if (!res.ok) {
      let errorMsg = 'Lỗi gửi hồ sơ KYC';
      try {
        const errJson = await res.json();
        errorMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message || errJson.error || errorMsg;
      } catch {
        errorMsg = await res.text();
      }
      throw new Error(errorMsg);
    }
    return res.json();
  },

  async updateStoreProfile(data: { storeName?: string; storeSlug?: string; description?: string }) {
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    return apiFetch(`${CATALOG_API}/api/v1/seller/kyc/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },
};
