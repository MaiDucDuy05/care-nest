'use client';

/**
 * GeofenceMap — Leaflet map for viewing/editing geofence zones.
 * Dynamic imported (client-only) to avoid SSR issues with Leaflet.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, Minimize2, Compass, Layers } from 'lucide-react';
import type { Geofence } from '@/lib/types';

interface GeofenceMapProps {
  geofences: Geofence[];
  center?: [number, number];
  zoom?: number;
  selectedId?: string | null;
  pendingLocation?: { lat: number; lng: number } | null;
  onZoneClick?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  editable?: boolean;
  height?: string | number;
}

export function GeofenceMap({
  geofences,
  center = [21.0381, 105.8234], // Default to Hanoi where sample geofences are
  zoom = 14,
  selectedId,
  pendingLocation,
  onZoneClick,
  onMapClick,
  editable = false,
  height = '480px',
}: GeofenceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layersGroupRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletModuleRef = useRef<any>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const initialFitDone = useRef(false);

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const editableRef = useRef(editable);
  editableRef.current = editable;

  const onZoneClickRef = useRef(onZoneClick);
  onZoneClickRef.current = onZoneClick;

  // Fit bounds helper
  const fitAllZones = useCallback(() => {
    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !Array.isArray(geofences) || geofences.length === 0) return;

    const coords: [number, number][] = [];
    geofences.forEach((gf) => {
      const lat = gf.circle?.center?.lat ?? (gf as any).centerLat;
      const lng = gf.circle?.center?.lng ?? (gf as any).centerLon;
      if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        coords.push([Number(lat), Number(lng)]);
      }
    });

    if (coords.length === 1) {
      map.setView(coords[0], 15, { animate: true });
    } else if (coords.length > 1) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
    }
  }, [geofences]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
  };

  // Initialize Map
  useEffect(() => {
    let isCancelled = false;
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      if (isCancelled || !mapRef.current) return;

      leafletModuleRef.current = L;

      // Fix default marker icon paths in Next.js
      // @ts-expect-error -- leaflet types are too narrow across versions
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Cleanup previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const container = mapRef.current as HTMLDivElement & { _leaflet_id?: number | null };
      if (container && container._leaflet_id) {
        delete container._leaflet_id;
      }

      // Determine initial center: if geofences exist, center on the first one
      let startCenter = center;
      if (Array.isArray(geofences) && geofences.length > 0) {
        const first = geofences[0];
        const lat = first.circle?.center?.lat ?? (first as any).centerLat;
        const lng = first.circle?.center?.lng ?? (first as any).centerLon;
        if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
          startCenter = [Number(lat), Number(lng)];
        }
      }

      const map = L.map(container, {
        center: startCenter,
        zoom,
        zoomControl: false,
      });
      mapInstanceRef.current = map;

      // Add Zoom Control bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // TileLayer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Dedicated layer group for geofences
      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;

      // Dedicated layer for pending click marker
      const pendingLayer = L.layerGroup().addTo(map);
      pendingLayerRef.current = pendingLayer;

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        if (editableRef.current && onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      // Render initial geofences
      renderGeofences(L, layersGroup, geofences, selectedId, (id) => onZoneClickRef.current?.(id));

      // Auto fit to bounds on initial load if geofences are present
      if (Array.isArray(geofences) && geofences.length > 0 && !initialFitDone.current) {
        initialFitDone.current = true;
        const coords: [number, number][] = [];
        geofences.forEach((gf) => {
          const lat = gf.circle?.center?.lat ?? (gf as any).centerLat;
          const lng = gf.circle?.center?.lng ?? (gf as any).centerLon;
          if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
            coords.push([Number(lat), Number(lng)]);
          }
        });
        if (coords.length > 1) {
          map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 15 });
        } else if (coords.length === 1) {
          map.setView(coords[0], 15);
        }
      }
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      layersGroupRef.current = null;
      pendingLayerRef.current = null;
      if (mapRef.current) {
        const container = mapRef.current as HTMLDivElement & { _leaflet_id?: number | null };
        if (container && container._leaflet_id) {
          delete container._leaflet_id;
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update geofence shapes when list or selection changes
  useEffect(() => {
    const L = leafletModuleRef.current;
    const layersGroup = layersGroupRef.current;
    const map = mapInstanceRef.current;
    if (!L || !layersGroup || !map) return;

    renderGeofences(L, layersGroup, geofences, selectedId, (id) => onZoneClickRef.current?.(id));

    // If initial fit was not done yet (e.g. data loaded async), do it now
    if (!initialFitDone.current && Array.isArray(geofences) && geofences.length > 0) {
      initialFitDone.current = true;
      fitAllZones();
    }
  }, [geofences, selectedId, fitAllZones]);

  // Smooth fly-to when selectedId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedId || !Array.isArray(geofences)) return;

    const targetGf = geofences.find((g) => g.id === selectedId);
    if (!targetGf) return;

    const lat = targetGf.circle?.center?.lat ?? (targetGf as any).centerLat;
    const lng = targetGf.circle?.center?.lng ?? (targetGf as any).centerLon;
    if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      map.flyTo([Number(lat), Number(lng)], 16, { duration: 1.0 });
    }
  }, [selectedId, geofences]);

  // Update pending location marker when user clicks to add a new zone
  useEffect(() => {
    const L = leafletModuleRef.current;
    const pendingLayer = pendingLayerRef.current;
    const map = mapInstanceRef.current;
    if (!L || !pendingLayer || !map) return;

    pendingLayer.clearLayers();

    if (pendingLocation) {
      const { lat, lng } = pendingLocation;

      // Draw dashed circle preview (radius 200m)
      L.circle([lat, lng], {
        radius: 200,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(pendingLayer);

      // Draw pending pin
      const pendingIcon = L.divIcon({
        className: 'custom-pending-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background-color: #f59e0b; opacity: 0.35; animation: ping 1.2s infinite;"></div>
            <div style="width: 28px; height: 28px; border-radius: 9999px; background: #f59e0b; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      L.marker([lat, lng], { icon: pendingIcon })
        .addTo(pendingLayer)
        .bindTooltip('Vị trí vùng an toàn mới', { permanent: true, direction: 'top' });

      map.panTo([lat, lng]);
    }
  }, [pendingLocation]);

  return (
    <>
      {/* Fullscreen Backdrop when open */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9990] transition-opacity"
          onClick={toggleFullscreen}
        />
      )}

      {/* Map Container Box */}
      <div
        className={`relative transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-4 sm:inset-10 z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden'
            : 'rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md'
        }`}
      >
        {/* Floating Controls Bar at Top */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none">
          {/* Left Pill: Zone Count & Quick Fit */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/95 backdrop-blur-md text-slate-800 shadow-md border border-slate-200/80">
              <Layers size={14} className="text-teal-600" />
              <span>{geofences.length} vùng an toàn</span>
            </span>

            {geofences.length > 0 && (
              <button
                type="button"
                onClick={fitAllZones}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/95 backdrop-blur-md text-slate-700 hover:text-teal-700 hover:bg-teal-50 shadow-md border border-slate-200/80 transition-colors cursor-pointer"
                title="Gom và hiển thị tất cả các vùng"
              >
                <Compass size={14} className="text-teal-600" />
                <span>Xem tất cả vùng</span>
              </button>
            )}
          </div>

          {/* Right Button: Toggle Fullscreen / Expand */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/95 backdrop-blur-md text-slate-800 hover:text-teal-600 hover:bg-slate-50 shadow-md border border-slate-200/80 transition-all cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ bản đồ' : 'Phóng to toàn màn hình'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={15} className="text-teal-600" />
                <span>Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 size={15} className="text-teal-600" />
                <span>Phóng to bản đồ</span>
              </>
            )}
          </button>
        </div>

        {/* Leaflet DOM Node */}
        <div
          ref={mapRef}
          style={{
            height: isFullscreen ? '100%' : typeof height === 'number' ? `${height}px` : height,
            width: '100%',
            zIndex: 1,
          }}
        />
      </div>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderGeofences(
  L: any,
  layersGroup: any,
  geofences: Geofence[],
  selectedId?: string | null,
  onClick?: (id: string) => void
) {
  if (!layersGroup) return;
  layersGroup.clearLayers();

  if (!Array.isArray(geofences)) return;

  geofences.forEach((gf) => {
    addGeofenceToMap(L, layersGroup, gf, gf.id === selectedId, onClick);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addGeofenceToMap(L: any, target: any, geofence: Geofence, isSelected: boolean, onClick?: (id: string) => void) {
  const primaryColor = isSelected ? '#0d9488' : '#3b82f6';

  const style = {
    color: primaryColor,
    fillColor: primaryColor,
    fillOpacity: isSelected ? 0.35 : 0.18,
    weight: isSelected ? 3.5 : 2,
    dashArray: isSelected ? undefined : '5, 5',
  };

  // Extract center coordinates
  let centerLat: number | null = null;
  let centerLng: number | null = null;
  let radiusM = 200;

  if (geofence.shape === 'CIRCLE' && geofence.circle) {
    centerLat = Number(geofence.circle.center.lat);
    centerLng = Number(geofence.circle.center.lng);
    radiusM = Number(geofence.circle.radiusM || 200);
  } else if ((geofence as any).centerLat != null && (geofence as any).centerLon != null) {
    centerLat = Number((geofence as any).centerLat);
    centerLng = Number((geofence as any).centerLon);
    radiusM = Number((geofence as any).radiusMeters || 200);
  }

  // Draw Circle
  if (centerLat != null && centerLng != null && !isNaN(centerLat) && !isNaN(centerLng)) {
    const circle = L.circle([centerLat, centerLng], { radius: radiusM, ...style });
    circle.addTo(target);

    if (onClick) {
      circle.on('click', () => onClick(geofence.id));
    }

    // Add Center Marker Pin with icon
    const markerIcon = L.divIcon({
      className: 'custom-gf-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; items-center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: ${primaryColor}; opacity: ${isSelected ? '0.45' : '0.2'};"></div>
          <div style="width: 26px; height: 26px; border-radius: 9999px; background: ${primaryColor}; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const marker = L.marker([centerLat, centerLng], { icon: markerIcon }).addTo(target);

    // Bind tooltip with name and radius
    const tooltipContent = `
      <div style="font-family: inherit; font-size: 12px; line-height: 1.3; font-weight: 700; color: #0f172a;">
        ${geofence.name}
        <div style="font-weight: 500; font-size: 11px; color: ${primaryColor}; margin-top: 1px;">
          Bán kính: ${radiusM}m
        </div>
      </div>
    `;

    marker.bindTooltip(tooltipContent, {
      permanent: true,
      direction: 'top',
      className: 'geofence-permanent-tooltip',
      offset: [0, -18],
    });

    if (onClick) {
      marker.on('click', () => onClick(geofence.id));
    }
  } else if (geofence.shape === 'POLYGON' && geofence.polygon) {
    const points = geofence.polygon.vertices.map((v) => [v.lat, v.lng] as [number, number]);
    const polygon = L.polygon(points, style);
    polygon.addTo(target);

    if (onClick) {
      polygon.on('click', () => onClick(geofence.id));
    }

    const label = L.tooltip({
      permanent: true,
      direction: 'center',
      className: 'geofence-label',
    }).setContent(geofence.name);
    polygon.bindTooltip(label);
  }
}
