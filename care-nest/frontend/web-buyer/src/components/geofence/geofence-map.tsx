'use client';

/**
 * GeofenceMap — Leaflet map for viewing/editing geofence zones.
 * Dynamic imported (client-only) to avoid SSR issues with Leaflet.
 */
import { useEffect, useRef } from 'react';
import type { Geofence } from '@/lib/types';

interface GeofenceMapProps {
  geofences: Geofence[];
  center?: [number, number];
  zoom?: number;
  selectedId?: string | null;
  onZoneClick?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  editable?: boolean;
}

export function GeofenceMap({
  geofences,
  center = [10.7769, 106.7009],
  zoom = 14,
  selectedId,
  onZoneClick,
  onMapClick,
  editable = false,
}: GeofenceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix default marker icon paths in Next.js
      // @ts-expect-error -- leaflet types are too narrow across versions
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView(center, zoom);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (editable && onMapClick) {
        map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      // Add existing geofences
      geofences.forEach((gf) => {
        addGeofenceToMap(L, map, gf, gf.id === selectedId, onZoneClick);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        height: '400px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
      }}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addGeofenceToMap(L: any, map: any, geofence: Geofence, isSelected: boolean, onClick?: (id: string) => void) {
  const color = isSelected ? '#0d9488' : '#4f46e5';
  const style = {
    color,
    fillColor: color,
    fillOpacity: isSelected ? 0.3 : 0.15,
    weight: isSelected ? 3 : 2,
  };

  // Leaflet's typed return for `L.circle` / `L.polygon` collapses to `{}`
  // when called via the loose `L: any` shim below; this structural type
  // covers the surface we actually use here.
  type Layer = {
    addTo: (m: unknown) => unknown;
    bindTooltip: (t: unknown) => unknown;
    on: (e: string, fn: () => void) => unknown;
  };
  let layer: Layer | null = null;

  if (geofence.shape === 'CIRCLE' && geofence.circle) {
    const { center: c, radiusM } = geofence.circle;
    layer = L.circle([c.lat, c.lng], { radius: radiusM, ...style }) as Layer;
  } else if (geofence.shape === 'POLYGON' && geofence.polygon) {
    const points = geofence.polygon.vertices.map((v) => [v.lat, v.lng] as [number, number]);
    layer = L.polygon(points, style) as Layer;
  }

  if (layer && onClick) {
    layer.on('click', () => onClick(geofence.id));
  }

  if (layer) {
    layer.addTo(map);
    // Add label
    const label = L.tooltip({
      permanent: true,
      direction: 'center',
      className: 'geofence-label',
    }).setContent(geofence.name);
    layer.bindTooltip(label);
  }
}
