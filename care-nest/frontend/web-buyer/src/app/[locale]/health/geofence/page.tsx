'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { GeofenceList } from '@/components/geofence/geofence-list';
import { GeofenceForm } from '@/components/geofence/geofence-form';
import type { Geofence } from '@/lib/types';
import { devicesService } from '@/services/devices.service';

// Dynamic import Leaflet (client-only)
const GeofenceMap = dynamic(() => import('@/components/geofence/geofence-map').then((m) => m.GeofenceMap), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '520px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-card-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
    }}>
      Đang tải bản đồ...
    </div>
  ),
});

export default function GeofencePage() {
  const t = useTranslations('geofence');
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadGeofences() {
      try {
        setIsLoading(true);
        const data = await devicesService.getGeofences();
        if (isMounted && Array.isArray(data)) {
          setGeofences(data);
          if (data.length > 0 && !selectedId) {
            setSelectedId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load geofences:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadGeofences();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingLocation({ lat, lng });
    setShowForm(true);
  }, []);

  const handleSubmit = async (data: Parameters<typeof GeofenceForm>[0]['onSubmit'] extends (data: infer T) => Promise<void> ? T : never) => {
    const payload = {
      name: data.name,
      shape: data.shape,
      center: pendingLocation ? { lat: pendingLocation.lat, lng: pendingLocation.lng } : undefined,
      radiusM: data.radiusM,
      alertEvents: data.alertEvents,
      isActive: data.isActive,
    };

    if (editingId) {
      const updated = await devicesService.updateGeofence(editingId, payload);
      setGeofences((prev) => prev.map((g) => (g.id === editingId ? updated : g)));
      setEditingId(null);
    } else {
      const created = await devicesService.createGeofence(payload);
      setGeofences((prev) => [...prev, created]);
      setSelectedId(created.id);
    }
    setShowForm(false);
    setPendingLocation(null);
  };

  const handleDelete = async (id: string) => {
    await devicesService.deleteGeofence(id);
    setGeofences((prev) => prev.filter((g) => g.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
    setSelectedId(id);
  };

  const handleZoneClick = (id: string) => {
    setSelectedId(id);
  };

  const selectedGf = geofences.find((g) => g.id === selectedId);

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{t('subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* Map */}
        <div>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {selectedGf ? (
                <>
                  Đang chọn: <strong style={{ color: 'var(--primary)' }}>{selectedGf.name}</strong> — Nhấp vào vùng khác hoặc danh sách bên phải để chuyển vị trí
                </>
              ) : (
                'Nhấn vào bản đồ để thêm vùng mới, hoặc nhấp vào danh sách bên phải để định vị'
              )}
            </span>
          </div>

          <GeofenceMap
            geofences={geofences}
            center={[21.0381, 105.8234]}
            zoom={14}
            selectedId={selectedId}
            pendingLocation={pendingLocation}
            onZoneClick={handleZoneClick}
            onMapClick={handleMapClick}
            editable
            height="520px"
          />
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <Plus size={16} /> {t('addNew')}
          </button>

          {showForm && (
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                {editingId ? t('edit') : t('addNew')}
              </h3>
              <GeofenceForm
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setEditingId(null); }}
                pendingLocation={pendingLocation}
                initialData={editingId ? geofences.find((g) => g.id === editingId) : undefined}
              />
            </div>
          )}

          <GeofenceList
            geofences={geofences}
            selectedId={selectedId}
            onSelect={handleZoneClick}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
