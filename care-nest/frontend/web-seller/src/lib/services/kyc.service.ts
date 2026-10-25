import { CATALOG_API, apiFetch, getToken } from '../api-client';
import type { KYCApplication, KYCStatus } from '../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

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
    if (USE_MOCK) {
      // Return null for "not started" so the UI knows to start the wizard.
      return null;
    }
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
    if (USE_MOCK) {
      const now = new Date().toISOString();
      return {
        id: 'kyc-mock-' + Date.now(),
        sellerId: 'seller-mock-1',
        status: 'IN_REVIEW' as KYCStatus,
        ...input,
        documents: documentFiles.map((f, i) => ({
          id: `doc-${i}`,
          type: 'BUSINESS_LICENSE' as const,
          url: URL.createObjectURL(f),
          fileName: f.name,
          uploadedAt: now,
        })),
        submittedAt: now,
        reviewedAt: null,
        reviewNote: null,
        createdAt: now,
        updatedAt: now,
      };
    }
    const token = getToken();
    if (!token) throw new Error('not authenticated');
    const form = new FormData();
    Object.entries(input).forEach(([k, v]) => form.append(k, v));
    documentFiles.forEach((f) => form.append('documents', f));

    const res = await fetch(`${CATALOG_API}/api/v1/seller/kyc`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
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
};
