'use client';

import { useEffect, useRef } from 'react';
import { ExternalLink, Navigation } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface LiveDeviceMapProps {
  lat?: number;
  lng?: number;
  deviceName?: string;
  locationName?: string;
  inGeofence?: string;
  isConnected?: boolean;
  height?: string | number;
}

export function LiveDeviceMap({
  lat = 21.0381,
  lng = 105.8234,
  deviceName = 'Thiết Bị Wonlex',
  locationName,
  inGeofence = 'Vùng an toàn (Nhà)',
  isConnected = true,
  height = '280px',
}: LiveDeviceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circleRef = useRef<any>(null);

  const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : 21.0381;
  const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : 105.8234;

  const displayLocation = locationName || inGeofence || 'Số 12A, Đường Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh';
  const isSafe = !inGeofence || inGeofence.toLowerCase().includes('nhà') || inGeofence.toLowerCase().includes('an toàn');

  // Initialize Map
  useEffect(() => {
    let isCancelled = false;
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      if (isCancelled || !mapRef.current) return;

      // Fix default marker icon paths in Next.js
      // @ts-expect-error -- leaflet types are too narrow across versions
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Cleanup any previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const container = mapRef.current as HTMLDivElement & { _leaflet_id?: number | null };
      if (container && container._leaflet_id) {
        delete container._leaflet_id;
      }

      // Initialize Leaflet map
      const map = L.map(container, {
        center: [safeLat, safeLng],
        zoom: 16,
        zoomControl: false,
      });
      mapInstanceRef.current = map;

      // Add Zoom control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add TileLayer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Pulsing Pin Icon
      const pulseIcon = L.divIcon({
        className: 'custom-gps-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background-color: #0d9488; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: linear-gradient(135deg, #0d9488, #0f766e); border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
      });

      // Add Marker
      const marker = L.marker([safeLat, safeLng], { icon: pulseIcon }).addTo(map);
      markerRef.current = marker;

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 3px 2px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${deviceName}</div>
          <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">${displayLocation}</div>
          <div style="font-family: monospace; font-size: 11px; color: #0d9488; background: #f0fdfa; padding: 2px 6px; border-radius: 4px; display: inline-block; border: 1px solid #ccfbf1;">
            ${safeLat.toFixed(4)}° N, ${safeLng.toFixed(4)}° E
          </div>
        </div>
      `);

      // Add Safe Zone Circle (Radius ~200m)
      const circleColor = isSafe ? '#0d9488' : '#ef4444';
      const circle = L.circle([safeLat, safeLng], {
        radius: 200,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '5, 5',
      }).addTo(map);
      circleRef.current = circle;
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
      circleRef.current = null;
      if (mapRef.current) {
        const container = mapRef.current as HTMLDivElement & { _leaflet_id?: number | null };
        if (container && container._leaflet_id) {
          delete container._leaflet_id;
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker and circle position on coordinate changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([safeLat, safeLng]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([safeLat, safeLng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([safeLat, safeLng], { animate: true });
    }
  }, [safeLat, safeLng]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
      {/* Map DOM Container */}
      <div
        ref={mapRef}
        style={{
          height,
          width: '100%',
          zIndex: 1,
        }}
      />

      {/* Floating Info Overlay at Bottom */}
      <div className="absolute bottom-2 left-2 right-12 z-[1000] pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-2.5 shadow-md border border-slate-200/80 flex items-center justify-between gap-3 text-left">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-xs font-bold text-slate-900 truncate">
                {displayLocation}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
              <Navigation size={11} className="text-teal-600 flex-shrink-0" />
              <span>{safeLat.toFixed(4)}° N, {safeLng.toFixed(4)}° E</span>
            </div>
          </div>

          <Link
            href="/health/geofence"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors whitespace-nowrap flex-shrink-0 border border-teal-200/60"
            title="Cài đặt vùng an toàn Geofence"
          >
            <span>Vùng an toàn</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

