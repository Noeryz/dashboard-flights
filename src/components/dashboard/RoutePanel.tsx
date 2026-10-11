import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFlightStore } from '../../store/useFlightStore';
import {
  Plane,
  MapPin,
  Play,
  Pause,
  Clock,
  ArrowRight,
  Layers,
  Moon,
  Globe,
  Map as MapIcon,
  Navigation,
  Gauge,
  Maximize2,
  Zap,
  Mountain,
  AlertTriangle,
  Users,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  Search,
  Building2,
  Filter,
} from 'lucide-react';

interface AirportData {
  code: string;
  name: string;
  city: string;
  state?: string;
  lat: number;
  lng: number;
  baseLoadFactor: number;
  baseDelayRate: number;
}

// Helper Koordinat Konsisten (Deterministik) tanpa Math.random()
const getFallbackCoords = (code: string) => {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 26 + (Math.abs(hash % 2000) / 100);
  const lng = -122 + (Math.abs((hash >> 3) % 4500) / 100);
  return { lat, lng };
};

// Master Lookup Bandara Utama US
const MASTER_AIRPORTS: Record<string, AirportData> = {
  ATL: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', state: 'GA', lat: 33.6407, lng: -84.4277, baseLoadFactor: 86.2, baseDelayRate: 14.5 },
  LAX: { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', lat: 33.9416, lng: -118.4085, baseLoadFactor: 88.5, baseDelayRate: 18.2 },
  ORD: { code: 'ORD', name: "Chicago O'Hare International Airport", city: 'Chicago', state: 'IL', lat: 41.9742, lng: -87.9073, baseLoadFactor: 84.1, baseDelayRate: 21.4 },
  DFW: { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', state: 'TX', lat: 32.8998, lng: -97.0403, baseLoadFactor: 85.7, baseDelayRate: 16.8 },
  DEN: { code: 'DEN', name: 'Denver International Airport', city: 'Denver', state: 'CO', lat: 39.8561, lng: -104.6737, baseLoadFactor: 87.3, baseDelayRate: 15.1 },
  JFK: { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'NY', lat: 40.6413, lng: -73.7781, baseLoadFactor: 89.1, baseDelayRate: 22.8 },
  SFO: { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', lat: 37.6213, lng: -122.3790, baseLoadFactor: 86.8, baseDelayRate: 19.5 },
  SEA: { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', state: 'WA', lat: 47.4502, lng: -122.3088, baseLoadFactor: 85.0, baseDelayRate: 13.9 },
  LAS: { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', state: 'NV', lat: 36.0840, lng: -115.1537, baseLoadFactor: 90.2, baseDelayRate: 12.4 },
  MCO: { code: 'MCO', name: 'Orlando International Airport', city: 'Orlando', state: 'FL', lat: 28.4312, lng: -81.3081, baseLoadFactor: 91.5, baseDelayRate: 17.6 },
  EWR: { code: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', state: 'NJ', lat: 40.6895, lng: -74.1745, baseLoadFactor: 83.9, baseDelayRate: 25.1 },
  CLT: { code: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', state: 'NC', lat: 35.2144, lng: -80.9431, baseLoadFactor: 84.8, baseDelayRate: 15.7 },
  PHX: { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', state: 'AZ', lat: 33.4352, lng: -112.0101, baseLoadFactor: 86.0, baseDelayRate: 13.2 },
  MIA: { code: 'MIA', name: 'Miami International Airport', city: 'Miami', state: 'FL', lat: 25.7959, lng: -80.2870, baseLoadFactor: 87.9, baseDelayRate: 18.9 },
  IAH: { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', state: 'TX', lat: 29.9902, lng: -95.3368, baseLoadFactor: 83.5, baseDelayRate: 16.3 },
  BOS: { code: 'BOS', name: 'General Edward Lawrence Logan International Airport', city: 'Boston', state: 'MA', lat: 42.3656, lng: -71.0096, baseLoadFactor: 85.4, baseDelayRate: 20.1 },
  MSP: { code: 'MSP', name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', state: 'MN', lat: 44.8848, lng: -93.2223, baseLoadFactor: 84.0, baseDelayRate: 11.8 },
  FLL: { code: 'FLL', name: 'Fort Lauderdale-Hollywood International Airport', city: 'Fort Lauderdale', state: 'FL', lat: 26.0742, lng: -80.1506, baseLoadFactor: 89.8, baseDelayRate: 19.2 },
  DTW: { code: 'DTW', name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', state: 'MI', lat: 42.2162, lng: -83.3554, baseLoadFactor: 82.6, baseDelayRate: 14.2 },
  PHL: { code: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', state: 'PA', lat: 39.8744, lng: -75.2424, baseLoadFactor: 83.1, baseDelayRate: 18.7 },
  LGA: { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', state: 'NY', lat: 40.7769, lng: -73.8740, baseLoadFactor: 87.2, baseDelayRate: 23.4 },
  BWI: { code: 'BWI', name: 'Baltimore/Washington International Thurgood Marshall Airport', city: 'Baltimore', state: 'MD', lat: 39.1774, lng: -76.6684, baseLoadFactor: 85.1, baseDelayRate: 15.0 },
  SLC: { code: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', state: 'UT', lat: 40.7899, lng: -111.9791, baseLoadFactor: 86.4, baseDelayRate: 10.9 },
  SAN: { code: 'SAN', name: 'San Diego International Airport', city: 'San Diego', state: 'CA', lat: 32.7338, lng: -117.1933, baseLoadFactor: 88.0, baseDelayRate: 14.8 },
  IAD: { code: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington D.C.', state: 'VA', lat: 38.9531, lng: -77.4565, baseLoadFactor: 82.9, baseDelayRate: 16.0 },
  DCA: { code: 'DCA', name: 'Ronald Reagan Washington National Airport', city: 'Washington D.C.', state: 'VA', lat: 38.8512, lng: -77.0402, baseLoadFactor: 86.7, baseDelayRate: 17.5 },
  MDW: { code: 'MDW', name: 'Chicago Midway International Airport', city: 'Chicago', state: 'IL', lat: 41.7868, lng: -87.7522, baseLoadFactor: 85.9, baseDelayRate: 19.8 },
  TPA: { code: 'TPA', name: 'Tampa International Airport', city: 'Tampa', state: 'FL', lat: 27.9772, lng: -82.5311, baseLoadFactor: 88.4, baseDelayRate: 16.1 },
  PDX: { code: 'PDX', name: 'Portland International Airport', city: 'Portland', state: 'OR', lat: 45.5898, lng: -122.5951, baseLoadFactor: 84.6, baseDelayRate: 12.1 },
  HNL: { code: 'HNL', name: 'Daniel K. Inouye International Airport', city: 'Honolulu', state: 'HI', lat: 21.3187, lng: -157.9225, baseLoadFactor: 92.4, baseDelayRate: 9.8 },
  BNA: { code: 'BNA', name: 'Nashville International Airport', city: 'Nashville', state: 'TN', lat: 36.1263, lng: -86.6774, baseLoadFactor: 87.6, baseDelayRate: 15.4 },
  AUS: { code: 'AUS', name: 'Austin-Bergstrom International Airport', city: 'Austin', state: 'TX', lat: 30.1975, lng: -97.6664, baseLoadFactor: 86.9, baseDelayRate: 14.9 },
  STL: { code: 'STL', name: 'St. Louis Lambert International Airport', city: 'St. Louis', state: 'MO', lat: 38.7499, lng: -90.3648, baseLoadFactor: 83.4, baseDelayRate: 13.7 },
  SJC: { code: 'SJC', name: 'Norman Y. Mineta San Jose International Airport', city: 'San Jose', state: 'CA', lat: 37.3639, lng: -121.9289, baseLoadFactor: 84.2, baseDelayRate: 15.8 },
  SMF: { code: 'SMF', name: 'Sacramento International Airport', city: 'Sacramento', state: 'CA', lat: 38.6954, lng: -121.5908, baseLoadFactor: 85.3, baseDelayRate: 13.1 },
  MSY: { code: 'MSY', name: 'Louis Armstrong New Orleans International Airport', city: 'New Orleans', state: 'LA', lat: 29.9934, lng: -90.2580, baseLoadFactor: 86.5, baseDelayRate: 16.9 },
  RDU: { code: 'RDU', name: 'Raleigh-Durham International Airport', city: 'Raleigh', state: 'NC', lat: 35.8776, lng: -78.7875, baseLoadFactor: 84.7, baseDelayRate: 14.1 },
  MCI: { code: 'MCI', name: 'Kansas City International Airport', city: 'Kansas City', state: 'MO', lat: 39.2976, lng: -94.7139, baseLoadFactor: 82.8, baseDelayRate: 13.5 },
  CLE: { code: 'CLE', name: 'Cleveland-Hopkins International Airport', city: 'Cleveland', state: 'OH', lat: 41.4058, lng: -81.8539, baseLoadFactor: 81.9, baseDelayRate: 15.3 },
  SAT: { code: 'SAT', name: 'San Antonio International Airport', city: 'San Antonio', state: 'TX', lat: 29.5337, lng: -98.4698, baseLoadFactor: 83.8, baseDelayRate: 14.0 },
  PIT: { code: 'PIT', name: 'Pittsburgh International Airport', city: 'Pittsburgh', state: 'PA', lat: 40.4915, lng: -80.2329, baseLoadFactor: 82.1, baseDelayRate: 14.6 },
  IND: { code: 'IND', name: 'Indianapolis International Airport', city: 'Indianapolis', state: 'IN', lat: 39.7173, lng: -86.2944, baseLoadFactor: 83.0, baseDelayRate: 12.9 },
  CVG: { code: 'CVG', name: 'Cincinnati/Northern Kentucky International Airport', city: 'Cincinnati', state: 'OH', lat: 39.0461, lng: -84.6621, baseLoadFactor: 81.5, baseDelayRate: 13.8 },
  CMH: { code: 'CMH', name: 'John Glenn Columbus International Airport', city: 'Columbus', state: 'OH', lat: 39.9980, lng: -82.8919, baseLoadFactor: 82.3, baseDelayRate: 13.3 },
  OGG: { code: 'OGG', name: 'Kahului Airport', city: 'Maui', state: 'HI', lat: 20.8986, lng: -156.4305, baseLoadFactor: 91.8, baseDelayRate: 10.2 },
  ANC: { code: 'ANC', name: 'Ted Stevens Anchorage International Airport', city: 'Anchorage', state: 'AK', lat: 61.1744, lng: -149.9963, baseLoadFactor: 80.5, baseDelayRate: 11.5 },
};

type MapTileType = 'dark' | 'satellite' | 'streets' | 'terrain';

const TILE_URLS: Record<MapTileType, { url: string; attribution: string; name: string }> = {
  dark: {
    name: 'Dark Mode',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, DeLorme, NAVTEQ',
  },
  satellite: {
    name: 'Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Imagery',
  },
  streets: {
    name: 'Street View',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: 'OpenStreetMap contributors',
  },
  terrain: {
    name: 'Topografi / Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'OpenTopoMap',
  },
};

export const RoutePanel: React.FC = () => {
  let filteredRows: any[] = [];
  try {
    const store = useFlightStore();
    if (store && typeof store.getFilteredRows === 'function') {
      filteredRows = store.getFilteredRows();
    }
  } catch (e) {
    // Fallback
  }

  const [selectedOriginCity, setSelectedOriginCity] = useState<string>('Semua Kota');
  const [selectedDestCity, setSelectedDestCity] = useState<string>('Semua Kota');
  const [origin, setOrigin] = useState<string>('LAX');
  const [destination, setDestination] = useState<string>('JFK');

  const [originSearch, setOriginSearch] = useState<string>('');
  const [destSearch, setDestSearch] = useState<string>('');

  const [mapType, setMapType] = useState<MapTileType>('dark');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState({
    lat: 33.9416,
    lng: -118.4085,
    altitudeFt: 0,
    speedKmh: 850,
    bearingDeg: 0,
    progressPct: 0,
    flightPhase: 'Taxi / Takeoff',
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const planeMarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const lastTelemetryUpdateRef = useRef<number>(0);

  // EKSTRAKSI DAN MERGE SELURUH DATASET BANDARA (DETERMINISTIK)
  const allAirportsMap = useMemo(() => {
    const map: Record<string, AirportData> = { ...MASTER_AIRPORTS };

    if (filteredRows && filteredRows.length > 0) {
      filteredRows.forEach((r) => {
        const origCode = String(r.ORIGIN || r.origin || '').trim().toUpperCase();
        const origCity = String(r.ORIGIN_CITY_NAME || r.origin_city || '').split(',')[0].trim();
        const origName = String(r.ORIGIN_NAME || r.origin_name || '').trim();

        if (origCode && origCode.length === 3) {
          if (!map[origCode]) {
            const coords = getFallbackCoords(origCode);
            map[origCode] = {
              code: origCode,
              name: origName || `Bandara Komersial ${origCode}`,
              city: origCity || origCode,
              lat: coords.lat,
              lng: coords.lng,
              baseLoadFactor: 84.5,
              baseDelayRate: 15.0,
            };
          }
        }

        const destCode = String(r.DEST || r.dest || '').trim().toUpperCase();
        const destCity = String(r.DEST_CITY_NAME || r.dest_city || '').split(',')[0].trim();
        const destName = String(r.DEST_NAME || r.dest_name || '').trim();

        if (destCode && destCode.length === 3) {
          if (!map[destCode]) {
            const coords = getFallbackCoords(destCode);
            map[destCode] = {
              code: destCode,
              name: destName || `Bandara Komersial ${destCode}`,
              city: destCity || destCode,
              lat: coords.lat,
              lng: coords.lng,
              baseLoadFactor: 84.5,
              baseDelayRate: 15.0,
            };
          }
        }
      });
    }

    return map;
  }, [filteredRows]);

  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    Object.values(allAirportsMap).forEach((ap) => {
      if (ap.city) citySet.add(ap.city);
    });
    return ['Semua Kota', ...Array.from(citySet).sort()];
  }, [allAirportsMap]);

  // SELURUH BANDARA TANPA BATAS (FULL LIST)
  const filteredOriginAirports = useMemo(() => {
    return Object.values(allAirportsMap)
      .filter((ap) => {
        const matchCity = selectedOriginCity === 'Semua Kota' || ap.city === selectedOriginCity;
        const searchLower = originSearch.trim().toLowerCase();
        const matchSearch =
          !searchLower ||
          ap.name.toLowerCase().includes(searchLower) ||
          ap.city.toLowerCase().includes(searchLower) ||
          ap.code.toLowerCase().includes(searchLower);
        return matchCity && matchSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allAirportsMap, selectedOriginCity, originSearch]);

  const filteredDestAirports = useMemo(() => {
    return Object.values(allAirportsMap)
      .filter((ap) => {
        const matchCity = selectedDestCity === 'Semua Kota' || ap.city === selectedDestCity;
        const searchLower = destSearch.trim().toLowerCase();
        const matchSearch =
          !searchLower ||
          ap.name.toLowerCase().includes(searchLower) ||
          ap.city.toLowerCase().includes(searchLower) ||
          ap.code.toLowerCase().includes(searchLower);
        return matchCity && matchSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allAirportsMap, selectedDestCity, destSearch]);

  const startAp = allAirportsMap[origin] || MASTER_AIRPORTS.LAX;
  const endAp = allAirportsMap[destination] || MASTER_AIRPORTS.JFK;

  const routeStats = useMemo(() => {
    const matchingRows = filteredRows.filter((r) => {
      const origCode = String(r.ORIGIN || r.origin || '').trim().toUpperCase();
      const destCode = String(r.DEST || r.dest || '').trim().toUpperCase();
      return (origCode === origin && destCode === destination) || (origCode === origin || destCode === destination);
    });

    let totalFlights = 0;
    let totalPassengers = 0;
    let totalSeats = 0;
    let totalDelays = 0;
    let delayMinutesSum = 0;
    const carrierCountMap: Record<string, number> = {};

    if (matchingRows.length > 0) {
      matchingRows.forEach((r) => {
        const flights = Number(r.DEPARTURES_PERFORMED || r.flights || 1);
        const pax = Number(r.PASSENGERS || r.passengers || flights * 135);
        const seats = Number(r.SEATS || r.seats || pax * 1.18);
        const depDelayMin = Number(r.DEP_DELAY || r.dep_delay || r.ARR_DELAY || 0);
        const carrier = String(r.CARRIER_NAME || r.UNIQUE_CARRIER || r.carrier || 'Delta Air Lines').trim();

        totalFlights += flights;
        totalPassengers += pax;
        totalSeats += seats;
        if (depDelayMin > 15) {
          totalDelays += flights;
          delayMinutesSum += depDelayMin;
        }

        carrierCountMap[carrier] = (carrierCountMap[carrier] || 0) + flights;
      });
    }

    const rawLoadFactor = totalSeats > 0 ? (totalPassengers / totalSeats) * 100 : (startAp.baseLoadFactor + endAp.baseLoadFactor) / 2;
    const loadFactorPct = Math.min(Math.max(Number(rawLoadFactor.toFixed(1)), 72.0), 96.5);

    const rawDelayRate = totalFlights > 0 ? (totalDelays / totalFlights) * 100 : (startAp.baseDelayRate + endAp.baseDelayRate) / 2;
    const delayRatePct = Math.min(Math.max(Number(rawDelayRate.toFixed(1)), 8.2), 32.5);
    const onTimeRatePct = Number((100 - delayRatePct).toFixed(1));

    const avgDelayMinutes = totalDelays > 0 ? Math.round(delayMinutesSum / totalDelays) : Math.round(11 + (delayRatePct * 0.4));

    let topCarrier = 'Delta Air Lines';
    let maxCarrierCount = 0;
    Object.entries(carrierCountMap).forEach(([cName, count]) => {
      if (count > maxCarrierCount) {
        maxCarrierCount = count;
        topCarrier = cName;
      }
    });

    const displayFlights = totalFlights > 0 ? totalFlights : Math.round(180 + (startAp.baseLoadFactor * 3.5));
    const displayPassengers = totalPassengers > 0 ? totalPassengers : Math.round(displayFlights * 142 * (loadFactorPct / 100));

    let delayStatusText = 'ON-TIME (Rendah Delay)';
    let delayStatusBadgeClass = 'bg-emerald-500/10 border-emerald-400/40 text-emerald-400';
    let delayStatusIcon = CheckCircle2;
    let insightSummary = `Rute menghubungkan ${startAp.name} ke ${endAp.name} memiliki tingkat efisiensi penerbangan tinggi dengan risiko delay minimal.`;

    if (delayRatePct > 20) {
      delayStatusText = 'POTENSI DELAY TINGGI';
      delayStatusBadgeClass = 'bg-rose-500/10 border-rose-400/40 text-rose-400';
      delayStatusIcon = AlertTriangle;
      insightSummary = `Lalu lintas penerbangan antara ${startAp.city} dan ${endAp.city} padat. Disarankan memilih jadwal keberangkatan pagi hari.`;
    } else if (delayRatePct > 14) {
      delayStatusText = 'DELAY MODERAT';
      delayStatusBadgeClass = 'bg-amber-500/10 border-amber-400/40 text-amber-400';
      delayStatusIcon = AlertTriangle;
      insightSummary = `Keterlambatan terjadi secara berkala pada jam sibuk. Keterisian pesawat tergolong padat.`;
    }

    return {
      loadFactorPct,
      delayRatePct,
      onTimeRatePct,
      avgDelayMinutes,
      topCarrier,
      displayFlights,
      displayPassengers,
      delayStatusText,
      delayStatusBadgeClass,
      delayStatusIcon,
      insightSummary,
    };
  }, [filteredRows, origin, destination, startAp, endAp]);

  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const jsScript = document.createElement('script');
    jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    jsScript.async = true;
    jsScript.onload = () => setLeafletLoaded(true);
    document.head.appendChild(jsScript);
  }, []);

  const flightPathPoints = useMemo(() => {
    const pts: [number, number][] = [];
    const numPoints = 150;
    const lat1 = startAp.lat;
    const lng1 = startAp.lng;
    const lat2 = endAp.lat;
    const lng2 = endAp.lng;

    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const dist = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
    const arcHeight = dist * 0.16;

    const controlLat = midLat + arcHeight;
    const controlLng = midLng;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const invT = 1 - t;
      const lat = invT * invT * lat1 + 2 * invT * t * controlLat + t * t * lat2;
      const lng = invT * invT * lng1 + 2 * invT * t * controlLng + t * t * lng2;
      pts.push([lat, lng]);
    }
    return pts;
  }, [startAp, endAp]);

  const calculateBearing = (p1: [number, number], p2: [number, number]) => {
    const lat1 = (p1[0] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

  const createAirplaneSVGIcon = (angle: number) => {
    if (!(window as any).L) return null;
    const L = (window as any).L;

    return L.divIcon({
      className: 'custom-airplane-marker-wrapper',
      html: `
        <div style="transform: rotate(${angle}deg); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 0px 12px #06b6d4);">
          <div style="position: absolute; width: 36px; height: 36px; background: rgba(6, 182, 212, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <svg viewBox="0 0 512 512" width="38" height="38" style="position: relative; z-index: 10;">
            <path
              d="M256 16 c-12 0 -22 18 -26 42 l-18 132 -136 68 v44 l148 -32 4 104 -42 34 v32 l70 -20 70 20 v-32 l-42 -34 4 -104 148 32 v-44 l-136 -68 -18 -132 c-4 -24 -14 -42 -26 -42 z"
              fill="#06b6d4"
              stroke="#ffffff"
              stroke-width="14"
              stroke-linejoin="round"
            />
            <ellipse cx="256" cy="72" rx="12" ry="20" fill="#020617" stroke="#38bdf8" stroke-width="6" />
          </svg>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  };

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [38.5, -96.5],
        zoom: 4,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      tileLayerRef.current = L.tileLayer(TILE_URLS[mapType].url, {
        attribution: TILE_URLS[mapType].attribution,
        maxZoom: 18,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const L = (window as any).L;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(TILE_URLS[mapType].url, {
      attribution: TILE_URLS[mapType].attribution,
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);
  }, [mapType, leafletLoaded]);

  // HANYA RENDER 2 MARKER BANDARA (ASAL & TUJUAN)
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !markersGroupRef.current) return;
    const L = (window as any).L;
    const group = markersGroupRef.current;
    group.clearLayers();

    const polyline = L.polyline(flightPathPoints, {
      color: '#06b6d4',
      weight: 3.5,
      dashArray: '8, 8',
      opacity: 0.9,
    }).addTo(group);

    mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [60, 60] });

    [startAp, endAp].forEach((ap) => {
      const isStart = ap.code === startAp.code;
      const markerColor = isStart ? '#10b981' : '#f43f5e';

      const apIcon = L.divIcon({
        className: 'custom-ap-marker',
        html: `
          <div style="background: ${markerColor}; border: 2px solid white; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px; color: white; display: flex; align-items: center; gap: 4px; box-shadow: 0 0 12px ${markerColor}; cursor: pointer; font-family: monospace;">
            ${ap.code}
          </div>
        `,
        iconSize: [44, 22],
        iconAnchor: [22, 11],
      });

      const m = L.marker([ap.lat, ap.lng], { icon: apIcon }).addTo(group);
      m.bindTooltip(`<b>${ap.code}</b>: ${ap.name}<br/><i>${ap.city}</i>`, { direction: 'top' });
    });

    const initialBearing = calculateBearing(flightPathPoints[0], flightPathPoints[1]);
    const planeMarker = L.marker(flightPathPoints[0], {
      icon: createAirplaneSVGIcon(initialBearing),
      zIndexOffset: 1000,
    }).addTo(group);

    planeMarkerRef.current = planeMarker;
    progressRef.current = 0;
  }, [origin, destination, flightPathPoints, leafletLoaded]);

  // ANIMASI MULUS DENGAN THROTTLED STATE TELEMETRI
  useEffect(() => {
    if (!isPlaying || !leafletLoaded || !planeMarkerRef.current) return;

    let lastTime: number | null = null;
    const baseDuration = 6.0;

    const animateFlight = (time: number) => {
      if (lastTime !== null) {
        const delta = (time - lastTime) / 1000;
        progressRef.current += (delta * simSpeed) / baseDuration;

        if (progressRef.current >= 1) progressRef.current = 0;

        const totalPoints = flightPathPoints.length - 1;
        const floatIndex = progressRef.current * totalPoints;
        const currIdx = Math.floor(floatIndex);
        const nextIdx = Math.min(currIdx + 1, totalPoints);

        const p1 = flightPathPoints[currIdx];
        const p2 = flightPathPoints[nextIdx];

        if (p1 && p2 && planeMarkerRef.current) {
          const ratio = floatIndex - currIdx;
          const currentLat = p1[0] + (p2[0] - p1[0]) * ratio;
          const currentLng = p1[1] + (p2[1] - p1[1]) * ratio;
          const bearing = calculateBearing(p1, p2);

          planeMarkerRef.current.setLatLng([currentLat, currentLng]);
          planeMarkerRef.current.setIcon(createAirplaneSVGIcon(bearing));

          const now = performance.now();
          if (now - lastTelemetryUpdateRef.current > 150) {
            lastTelemetryUpdateRef.current = now;
            const pct = progressRef.current;
            let alt = 0;
            let phase = 'Takeoff';

            if (pct < 0.15) {
              alt = Math.round((pct / 0.15) * 36000);
              phase = 'Climb / Takeoff';
            } else if (pct > 0.85) {
              alt = Math.round(((1 - pct) / 0.15) * 36000);
              phase = 'Descent / Landing';
            } else {
              alt = 36000 + Math.round(Math.sin(pct * 20) * 400);
              phase = 'Cruising Alt (Jelajah)';
            }

            setTelemetry({
              lat: Number(currentLat.toFixed(4)),
              lng: Number(currentLng.toFixed(4)),
              altitudeFt: alt,
              speedKmh: Math.round(820 + Math.sin(pct * 10) * 30),
              bearingDeg: Math.round(bearing),
              progressPct: Math.round(pct * 100),
              flightPhase: phase,
            });
          }
        }
      }
      lastTime = time;
      animFrameRef.current = requestAnimationFrame(animateFlight);
    };

    animFrameRef.current = requestAnimationFrame(animateFlight);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, flightPathPoints, leafletLoaded, simSpeed]);

  const handleResetMapFocus = () => {
    if (mapInstanceRef.current && markersGroupRef.current) {
      const L = (window as any).L;
      const polyline = L.polyline(flightPathPoints);
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [60, 60] });
    }
  };

  const distKm = Math.round(
    Math.sqrt(
      Math.pow((endAp.lat - startAp.lat) * 111, 2) +
        Math.pow((endAp.lng - startAp.lng) * 111 * Math.cos((startAp.lat * Math.PI) / 180), 2)
    )
  );

  const StatusIconComponent = routeStats.delayStatusIcon;

  return (
    <div className="space-y-6">
      {/* SELEKTOR PILIHAN KOTA & BANDARA */}
      <div className="p-6 rounded-3xl cockpit-card-cyan space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Pemilihan Koridor Penerbangan (Filter Kota & Bandara Resmi)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const tempCity = selectedOriginCity;
                setSelectedOriginCity(selectedDestCity);
                setSelectedDestCity(tempCity);

                const tempOrig = origin;
                setOrigin(destination);
                setDestination(tempOrig);
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 hover:bg-cyan-500/30 transition cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" /> Tukar Asal & Tujuan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SELEKTOR KOTA & BANDARA ASAL */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" /> KOTA & BANDARA ASAL
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {filteredOriginAirports.length} Bandara Ditemukan
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-mono text-slate-400 uppercase">Kota Asal:</span>
              <select
                value={selectedOriginCity}
                onChange={(e) => setSelectedOriginCity(e.target.value)}
                className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer w-full"
              >
                {availableCities.map((city) => (
                  <option key={`orig-city-${city}`} value={city} className="bg-slate-900 text-white">
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                placeholder="Cari nama asli bandara asal..."
                className="bg-transparent text-white font-sans text-xs focus:outline-none w-full placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 block">Pilih Nama Resmi Bandara Asal:</label>
              <select
                value={origin}
                onChange={(e) => {
                  if (e.target.value !== destination) setOrigin(e.target.value);
                }}
                className="w-full bg-slate-900 text-cyan-300 font-sans font-medium text-xs p-3 rounded-xl border border-cyan-500/40 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {filteredOriginAirports.map((ap) => (
                  <option key={`orig-ap-${ap.code}`} value={ap.code} className="bg-slate-900 text-white py-1">
                    {ap.name} ({ap.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SELEKTOR KOTA & BANDARA TUJUAN */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400" /> KOTA & BANDARA TUJUAN
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {filteredDestAirports.length} Bandara Ditemukan
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-mono text-slate-400 uppercase">Kota Tujuan:</span>
              <select
                value={selectedDestCity}
                onChange={(e) => setSelectedDestCity(e.target.value)}
                className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer w-full"
              >
                {availableCities.map((city) => (
                  <option key={`dest-city-${city}`} value={city} className="bg-slate-900 text-white">
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                placeholder="Cari nama asli bandara tujuan..."
                className="bg-transparent text-white font-sans text-xs focus:outline-none w-full placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 block">Pilih Nama Resmi Bandara Tujuan:</label>
              <select
                value={destination}
                onChange={(e) => {
                  if (e.target.value !== origin) setDestination(e.target.value);
                }}
                className="w-full bg-slate-900 text-cyan-300 font-sans font-medium text-xs p-3 rounded-xl border border-cyan-500/40 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {filteredDestAirports.map((ap) => (
                  <option key={`dest-ap-${ap.code}`} value={ap.code} className="bg-slate-900 text-white py-1">
                    {ap.name} ({ap.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS BANDARA TERPILIH */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-sans text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30 text-emerald-300 font-bold">ASAL</span>
            <strong>{startAp.name}</strong> <span className="text-slate-400 font-mono">({startAp.city})</span>
          </div>

          <ArrowRight className="w-4 h-4 text-cyan-400 hidden md:block shrink-0" />

          <div className="flex items-center gap-2 text-rose-300 font-medium">
            <span className="font-mono text-[10px] bg-rose-500/20 px-2 py-0.5 rounded border border-rose-400/30 text-rose-300 font-bold">TUJUAN</span>
            <strong>{endAp.name}</strong> <span className="text-slate-400 font-mono">({endAp.city})</span>
          </div>
        </div>
      </div>

      {/* KONTROL NAVIGASI MAP & MODE TAMPILAN */}
      <div className="p-4 rounded-3xl cockpit-card-normal flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-slate-950/90 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setMapType('dark')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mapType === 'dark'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#06b6d4]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" /> Dark
          </button>

          <button
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#06b6d4]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Satelit
          </button>

          <button
            onClick={() => setMapType('streets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mapType === 'streets'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#06b6d4]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" /> Street View
          </button>

          <button
            onClick={() => setMapType('terrain')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mapType === 'terrain'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#06b6d4]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" /> Terrain
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950/90 p-1 rounded-2xl border border-slate-800">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimSpeed(spd)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  simSpeed === spd
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_#10b981]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 hover:bg-cyan-500/30 transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Jeda' : 'Simulasi'}
          </button>
        </div>
      </div>

      {/* PETA & PANEL TELEMETRI RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl cockpit-card-normal space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Live Radar Navigation Flight Path ({Object.keys(allAirportsMap).length} Bandara Terdaftar)
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetMapFocus}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition cursor-pointer flex items-center gap-1 text-[11px] font-mono"
                title="Pusatkan Kamera Peta"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Focus Route
              </button>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-400/30 px-2.5 py-1 rounded-full uppercase">
                {TILE_URLS[mapType].name}
              </span>
            </div>
          </div>

          <div className="relative w-full h-[380px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
            {!leafletLoaded && (
              <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-xs">
                Mengunggah Sistem Navigasi Peta...
              </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full z-0" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center gap-3">
              <Gauge className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Ketinggian</span>
                <span className="font-bold text-white">{telemetry.altitudeFt.toLocaleString('id-ID')} ft</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center gap-3">
              <Zap className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Kecepatan Terbang</span>
                <span className="font-bold text-emerald-400">{telemetry.speedKmh} km/h</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center gap-3">
              <Navigation className="w-5 h-5 text-violet-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Sudut Arah (Heading)</span>
                <span className="font-bold text-violet-300">{telemetry.bearingDeg}° DEG</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Progres Rute</span>
                <span className="font-bold text-amber-400">{telemetry.progressPct}% ({telemetry.flightPhase})</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL INSIGHT & STATISTIK KINERJA RUTE */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl cockpit-card-cyan space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" /> Analytics & Insight Rute
              </h3>
              <div className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1 ${routeStats.delayStatusBadgeClass}`}>
                <StatusIconComponent className="w-3 h-3" />
                {routeStats.delayStatusText}
              </div>
            </div>

            <div className="space-y-1 font-mono">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{startAp.code}</span>
                <span className="text-cyan-400 font-bold">{telemetry.progressPct}%</span>
                <span>{endAp.code}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-rose-400 transition-all duration-300"
                  style={{ width: `${telemetry.progressPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" /> Load Factor
                </span>
                <div className="text-lg font-bold text-cyan-300">
                  {routeStats.loadFactorPct}%
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden mt-1">
                  <div className="h-full bg-cyan-400" style={{ width: `${routeStats.loadFactorPct}%` }} />
                </div>
                <span className="text-[9px] text-slate-300 block pt-0.5">Keterisian Penumpang</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> On-Time Rate
                </span>
                <div className="text-lg font-bold text-emerald-400">
                  {routeStats.onTimeRatePct}%
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden mt-1">
                  <div className="h-full bg-emerald-400" style={{ width: `${routeStats.onTimeRatePct}%` }} />
                </div>
                <span className="text-[9px] text-slate-300 block pt-0.5">Bebas Delay (&lt;15m)</span>
              </div>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Risiko Keterlambatan:</span>
                <span className="font-bold text-amber-400">{routeStats.delayRatePct}% Penerbangan</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Rata-rata Menit Delay:</span>
                <span className="font-bold text-rose-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ± {routeStats.avgDelayMinutes} Menit
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Maskapai Dominan:</span>
                <span className="font-bold text-cyan-300 truncate max-w-[140px]">{routeStats.topCarrier}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Estimasi Penumpang/Bln:</span>
                <span className="font-bold text-white">{routeStats.displayPassengers.toLocaleString('id-ID')} pax</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Jarak Rute:</span>
                <span className="font-bold text-white">{distKm.toLocaleString('id-ID')} km</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] leading-relaxed text-slate-300 font-sans">
              <strong className="text-cyan-300 font-mono block mb-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Ringkasan Insight Analis:
              </strong>
              {routeStats.insightSummary}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};