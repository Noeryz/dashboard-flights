import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFlightStore } from '../../store/useFlightStore';
import { US_AIRPORT_NAMES } from '../../utils/referenceData';
import { Compass, Layers, Map as MapIcon, Globe, Mountain, type LucideIcon } from 'lucide-react';

interface RouteMapProps {
  origin: string;
  destination: string;
}

type MapMode = 'dark' | 'street' | 'satellite' | 'topo';

const TILE_LAYERS: Record<MapMode, { url: string; name: string; icon: LucideIcon }> = {
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    name: 'Dark Mode',
    icon: Globe,
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: 'Street View',
    icon: MapIcon,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Satelit',
    icon: Layers,
  },
  topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    name: 'Topografi',
    icon: Mountain,
  },
};

const FALLBACK_COORDS: Record<string, { lat: number; lng: number }> = {
  ATL: { lat: 33.6407, lng: -84.4277 },
  JFK: { lat: 40.6413, lng: -73.7781 },
  LAX: { lat: 33.9416, lng: -118.4085 },
  ORD: { lat: 41.9742, lng: -87.9073 },
  DFW: { lat: 32.8998, lng: -97.0403 },
  DEN: { lat: 39.8561, lng: -104.6737 },
  SFO: { lat: 37.6213, lng: -122.379 },
  BOS: { lat: 42.3656, lng: -71.0096 },
  MKE: { lat: 42.9472, lng: -87.8966 },
  ACK: { lat: 41.2531, lng: -70.0602 },
  BHM: { lat: 33.5629, lng: -86.7535 },
  MIA: { lat: 25.7959, lng: -80.287 },
  SEA: { lat: 47.4502, lng: -122.3088 },
  LAS: { lat: 36.084, lng: -115.1537 },
  PHX: { lat: 33.4352, lng: -112.0101 },
};

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Hitung Sudut Rotasi Ikon Pesawat (Bearing)
function calculateBearing(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export const RouteMap: React.FC<RouteMapProps> = ({ origin, destination }) => {
  const { airportCoords, rawRows } = useFlightStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [mapMode, setMapMode] = useState<MapMode>('dark');

  const originCoord = airportCoords[origin] || FALLBACK_COORDS[origin];
  const destCoord = airportCoords[destination] || FALLBACK_COORDS[destination];

  const cityInfo = useMemo(() => {
    let originCity = '';
    let destCity = '';
    for (let i = 0; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (!originCity && r.ORIGIN === origin) originCity = r.ORIGIN_CITY_NAME || '';
      if (!destCity && r.DEST === destination) destCity = r.DEST_CITY_NAME || '';
      if (originCity && destCity) break;
    }
    return {
      originCity: originCity || origin,
      destCity: destCity || destination,
    };
  }, [rawRows, origin, destination]);

  const distanceMiles = useMemo(() => {
    if (!originCoord || !destCoord) return 0;
    return calculateHaversineDistance(
      originCoord.lat,
      originCoord.lng,
      destCoord.lat,
      destCoord.lng
    );
  }, [originCoord, destCoord]);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([39.8283, -98.5795], 4);

      mapInstanceRef.current = map;
    }
  }, []);

  // Berganti Mode Layer Peta
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(TILE_LAYERS[mapMode].url, {
      maxZoom: 18,
    });
    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
  }, [mapMode]);

  // Render Marker, Garis Rute, dan Animasi Pergerakan Pesawat
  useEffect(() => {
    if (!mapInstanceRef.current || !originCoord || !destCoord) return;

    const map = mapInstanceRef.current;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    map.eachLayer((layer) => {
      if (
        layer instanceof L.CircleMarker ||
        layer instanceof L.Polyline ||
        layer instanceof L.Marker
      ) {
        map.removeLayer(layer);
      }
    });

    const p1: [number, number] = [originCoord.lat, originCoord.lng];
    const p2: [number, number] = [destCoord.lat, destCoord.lng];

    // Marker Asal
    const originMarker = L.circleMarker(p1, {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#06b6d4',
      fillOpacity: 0.9,
    }).addTo(map);

    originMarker.bindPopup(
      `<div style="color:#0f172a; font-weight:bold;">
        <span style="color:#0284c7; font-size:14px;">[ASAL] ${origin}</span><br/>
        ${cityInfo.originCity}<br/>
        <small style="color:#64748b;">${US_AIRPORT_NAMES[origin] || ''}</small>
      </div>`
    );

    // Marker Tujuan
    const destMarker = L.circleMarker(p2, {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#8b5cf6',
      fillOpacity: 0.9,
    }).addTo(map);

    destMarker.bindPopup(
      `<div style="color:#0f172a; font-weight:bold;">
        <span style="color:#7c3aed; font-size:14px;">[TUJUAN] ${destination}</span><br/>
        ${cityInfo.destCity}<br/>
        <small style="color:#64748b;">${US_AIRPORT_NAMES[destination] || ''}</small>
      </div>`
    );

    // Garis Rute
    L.polyline([p1, p2], {
      color: '#06b6d4',
      weight: 3,
      opacity: 0.7,
      dashArray: '6, 6',
    }).addTo(map);

    // Hitung Sudut Arah Pesawat
    const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

    const planeHtml = `
      <div style="transform: rotate(${bearing}deg); display: flex; items-center; justify-content: center; filter: drop-shadow(0px 0px 8px #06b6d4);">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="#06b6d4" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
        </svg>
      </div>
    `;

    const planeIcon = L.divIcon({
      html: planeHtml,
      className: 'animated-plane-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const planeMarker = L.marker(p1, { icon: planeIcon }).addTo(map);

    // Animasi Pergerakan Pesawat
    const duration = 5000;
    let startTime: number | null = null;

    const animatePlane = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;

      const currentLat = p1[0] + (p2[0] - p1[0]) * progress;
      const currentLng = p1[1] + (p2[1] - p1[1]) * progress;

      planeMarker.setLatLng([currentLat, currentLng]);
      animFrameRef.current = requestAnimationFrame(animatePlane);
    };

    animFrameRef.current = requestAnimationFrame(animatePlane);

    const bounds = L.latLngBounds([p1, p2]);
    map.fitBounds(bounds, { padding: [60, 60] });

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [originCoord, destCoord, origin, destination, cityInfo]);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-flight-cyan" />
          <h3 className="text-sm font-bold text-white">Peta interaktif rute penerbangan</h3>
        </div>
        {distanceMiles > 0 && (
          <span className="text-xs font-mono font-bold text-flight-cyan bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 w-fit">
            Jarak Udara: {distanceMiles.toLocaleString()} mil (~{Math.round(distanceMiles * 1.609)} km)
          </span>
        )}
      </div>

      <div className="relative w-full h-[380px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80">
        {/* Switcher Mode Peta */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800">
          {(Object.keys(TILE_LAYERS) as MapMode[]).map((mode) => {
            const Icon = TILE_LAYERS[mode].icon;
            const isActive = mapMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setMapMode(mode)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-flight-cyan text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={TILE_LAYERS[mode].name}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{TILE_LAYERS[mode].name}</span>
              </button>
            );
          })}
        </div>

        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Info Rute Overlay Bawah */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs pointer-events-none z-[1000]">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 backdrop-blur-md max-w-[45%]">
            <p className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-flight-cyan inline-block"></span> ASAL (ORIGIN)
            </p>
            <p className="font-bold text-flight-cyan truncate">{origin} - {cityInfo.originCity}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-right backdrop-blur-md max-w-[45%]">
            <p className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-end gap-1">
              TUJUAN (DESTINATION) <span className="w-2 h-2 rounded-full bg-flight-violet inline-block"></span>
            </p>
            <p className="font-bold text-flight-violet truncate">{destination} - {cityInfo.destCity}</p>
          </div>
        </div>
      </div>
    </div>
  );
};