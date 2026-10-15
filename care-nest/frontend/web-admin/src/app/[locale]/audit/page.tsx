'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { apiClient, type AuditEventAdmin } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import { AuditTable } from '@/components/audit/audit-table';
import { AuditFilterBar } from '@/components/audit/audit-filter-bar';
import { AuditDiffViewer } from '@/components/audit/audit-diff-viewer';
import { useAuditFilter, type AuditFilters } from '@/lib/hooks/use-audit-filter';

function AuditPageInner() {
  const t = useTranslations('audit');
  const { user } = useAuth();
  const { filters, setFilters, clearFilters } = useAuditFilter();
  const [data, setData] = useState<AuditEventAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AuditEventAdmin | null>(null);

  const fetchData = useCallback(async (f: AuditFilters) => {
    setLoading(true);
    try {
      const res = await apiClient.audit.list({ ...f, limit: 50 });
      setData(res.data);
      setTotalPages(res.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(filters); }, [filters, fetchData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{t('pendingTitle')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pendingDesc')}</p>
      </div>

      <AuditFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
        canExport={user?.role === 'ADMIN'}
        onExportCsv={() => {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
          window.open(`/api/v1/audit/export?${params.toString()}`, '_blank');
        }}
      />

      <AuditTable
        data={data}
        loading={loading}
        onView={setSelectedEvent}
        page={filters.page || 1}
        totalPages={totalPages}
        onPageChange={(p) => setFilters({ page: p })}
      />

      <AuditDiffViewer
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuditPageInner />
    </Suspense>
  );
}
