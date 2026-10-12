import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFlightStore } from '../../store/useFlightStore';
import {
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
  lat?: number;
  lng?: number;
}

// Master Lookup Bandara Utama US
const MASTER_AIRPORTS: Record<string, AirportData> = {
  ATL: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', state: 'GA', lat: 33.6407, lng: -84.4277 },
  LAX: { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', state: 'CA', lat: 33.9416, lng: -118.4085 },
  ORD: { code: 'ORD', name: "Chicago O'Hare International Airport", city: 'Chicago', state: 'IL', lat: 41.9742, lng: -87.9073 },
  DFW: { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', state: 'TX', lat: 32.8998, lng: -97.0403 },
  DEN: { code: 'DEN', name: 'Denver International Airport', city: 'Denver', state: 'CO', lat: 39.8561, lng: -104.6737 },
  JFK: { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', state: 'NY', lat: 40.6413, lng: -73.7781 },
  SFO: { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', state: 'CA', lat: 37.6213, lng: -122.3790 },
  SEA: { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', state: 'WA', lat: 47.4502, lng: -122.3088 },
  LAS: { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', state: 'NV', lat: 36.0840, lng: -115.1537 },
  MCO: { code: 'MCO', name: 'Orlando International Airport', city: 'Orlando', state: 'FL', lat: 28.4312, lng: -81.3081 },
  EWR: { code: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', state: 'NJ', lat: 40.6895, lng: -74.1745 },
  CLT: { code: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', state: 'NC', lat: 35.2144, lng: -80.9431 },
  PHX: { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', state: 'AZ', lat: 33.4352, lng: -112.0101 },
  MIA: { code: 'MIA', name: 'Miami International Airport', city: 'Miami', state: 'FL', lat: 25.7959, lng: -80.2870 },
  IAH: { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', state: 'TX', lat: 29.9902, lng: -95.3368 },
  BOS: { code: 'BOS', name: 'General Edward Lawrence Logan International Airport', city: 'Boston', state: 'MA', lat: 42.3656, lng: -71.0096 },
  MSP: { code: 'MSP', name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', state: 'MN', lat: 44.8848, lng: -93.2223 },
  FLL: { code: 'FLL', name: 'Fort Lauderdale-Hollywood International Airport', city: 'Fort Lauderdale', state: 'FL', lat: 26.0742, lng: -80.1506 },
  DTW: { code: 'DTW', name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', state: 'MI', lat: 42.2162, lng: -83.3554 },
  PHL: { code: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', state: 'PA', lat: 39.8744, lng: -75.2424 },
  LGA: { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', state: 'NY', lat: 40.7769, lng: -73.8740 },
  BWI: { code: 'BWI', name: 'Baltimore/Washington International Thurgood Marshall Airport', city: 'Baltimore', state: 'MD', lat: 39.1774, lng: -76.6684 },
  SLC: { code: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', state: 'UT', lat: 40.7899, lng: -111.9791 },
  SAN: { code: 'SAN', name: 'San Diego International Airport', city: 'San Diego', state: 'CA', lat: 32.7338, lng: -117.1933 },
  IAD: { code: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington D.C.', state: 'VA', lat: 38.9531, lng: -77.4565 },
  DCA: { code: 'DCA', name: 'Ronald Reagan Washington National Airport', city: 'Washington D.C.', state: 'VA', lat: 38.8512, lng: -77.0402 },
  MDW: { code: 'MDW', name: 'Chicago Midway International Airport', city: 'Chicago', state: 'IL', lat: 41.7868, lng: -87.7522 },
  TPA: { code: 'TPA', name: 'Tampa International Airport', city: 'Tampa', state: 'FL', lat: 27.9772, lng: -82.5311 },
  PDX: { code: 'PDX', name: 'Portland International Airport', city: 'Portland', state: 'OR', lat: 45.5898, lng: -122.5951 },
  HNL: { code: 'HNL', name: 'Daniel K. Inouye International Airport', city: 'Honolulu', state: 'HI', lat: 21.3187, lng: -157.9225 },
  BNA: { code: 'BNA', name: 'Nashville International Airport', city: 'Nashville', state: 'TN', lat: 36.1263, lng: -86.6774 },
  AUS: { code: 'AUS', name: 'Austin-Bergstrom International Airport', city: 'Austin', state: 'TX', lat: 30.1975, lng: -97.6664 },
  STL: { code: 'STL', name: 'St. Louis Lambert International Airport', city: 'St. Louis', state: 'MO', lat: 38.7499, lng: -90.3648 },
  SJC: { code: 'SJC', name: 'Norman Y. Mineta San Jose International Airport', city: 'San Jose', state: 'CA', lat: 37.3639, lng: -121.9289 },
  SMF: { code: 'SMF', name: 'Sacramento International Airport', city: 'Sacramento', state: 'CA', lat: 38.6954, lng: -121.5908 },
  MSY: { code: 'MSY', name: 'Louis Armstrong New Orleans International Airport', city: 'New Orleans', state: 'LA', lat: 29.9934, lng: -90.2580 },
  RDU: { code: 'RDU', name: 'Raleigh-Durham International Airport', city: 'Raleigh', state: 'NC', lat: 35.8776, lng: -78.7875 },
  MCI: { code: 'MCI', name: 'Kansas City International Airport', city: 'Kansas City', state: 'MO', lat: 39.2976, lng: -94.7139 },
  CLE: { code: 'CLE', name: 'Cleveland-Hopkins International Airport', city: 'Cleveland', state: 'OH', lat: 41.4058, lng: -81.8539 },
  SAT: { code: 'SAT', name: 'San Antonio International Airport', city: 'San Antonio', state: 'TX', lat: 29.5337, lng: -98.4698 },
  PIT: { code: 'PIT', name: 'Pittsburgh International Airport', city: 'Pittsburgh', state: 'PA', lat: 40.4915, lng: -80.2329 },
  IND: { code: 'IND', name: 'Indianapolis International Airport', city: 'Indianapolis', state: 'IN', lat: 39.7173, lng: -86.2944 },
  CVG: { code: 'CVG', name: 'Cincinnati/Northern Kentucky International Airport', city: 'Cincinnati', state: 'OH', lat: 39.0461, lng: -84.6621 },
  CMH: { code: 'CMH', name: 'John Glenn Columbus International Airport', city: 'Columbus', state: 'OH', lat: 39.9980, lng: -82.8919 },
  OGG: { code: 'OGG', name: 'Kahului Airport', city: 'Maui', state: 'HI', lat: 20.8986, lng: -156.4305 },
  ANC: { code: 'ANC', name: 'Ted Stevens Anchorage International Airport', city: 'Anchorage', state: 'AK', lat: 61.1744, lng: -149.9963 },
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
  const { rawRows, filters, setRouteSelection, airportCoords } = useFlightStore();

  const { origin, destination } = filters;
  const filteredRows = useMemo(
    () => rawRows.filter((row) =>
      (filters.year === 'ALL' || String(row.YEAR || '') === filters.year) &&
      (filters.month === 'ALL' || String(row.MONTH || '') === filters.month) &&
      (filters.carrier === 'ALL' || String(row.UNIQUE_CARRIER || '').trim().toUpperCase() === filters.carrier),
    ),
    [rawRows, filters.year, filters.month, filters.carrier],
  );
  const selectedOriginCity = filters.originCity;
  const selectedDestCity = filters.destinationCity;

  const [originSearch, setOriginSearch] = useState<string>('');
  const [destSearch, setDestSearch] = useState<string>('');

  const [mapType, setMapType] = useState<MapTileType>('dark');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const planeMarkerRef = useRef<L.Marker | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const lastTelemetryUpdateRef = useRef<number>(0);

  // Bandara tanpa koordinat tetap tersedia di pemilih, tetapi tidak dipetakan.
  const allAirportsMap = useMemo(() => {
    const map: Record<string, AirportData> = {};
    const enrich = (code: string, cityName: string) => {
      if (!code) return;
      const knownAirport = MASTER_AIRPORTS[code];
      const coordinate = airportCoords[code];
      const hasValidCoordinates = coordinate && Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng);
      const existing = map[code] ?? knownAirport;
      map[code] = {
        code,
        name: existing?.name ?? `Bandara ${code}`,
        city: cityName || existing?.city || code,
        state: existing?.state,
        lat: hasValidCoordinates ? coordinate.lat : existing?.lat,
        lng: hasValidCoordinates ? coordinate.lng : existing?.lng,
      };
    };
    filteredRows.forEach((row) => {
      enrich(String(row.ORIGIN || '').trim().toUpperCase(), String(row.ORIGIN_CITY_NAME || '').trim());
      enrich(String(row.DEST || '').trim().toUpperCase(), String(row.DEST_CITY_NAME || '').trim());
    });
    Object.values(MASTER_AIRPORTS).forEach((airport) => {
      if (!map[airport.code]) {
        const coordinate = airportCoords[airport.code];
        const hasValidCoordinates = coordinate && Number.isFinite(coordinate.lat) && Number.isFinite(coordinate.lng);
        map[airport.code] = {
          ...airport,
          lat: hasValidCoordinates ? coordinate.lat : airport.lat,
          lng: hasValidCoordinates ? coordinate.lng : airport.lng,
        };
      }
    });
    return map;
  }, [filteredRows, airportCoords]);

  const routeIndex = useMemo(() => {
    const originCodes = new Set<string>();
    const destinationsByOrigin = new Map<string, Set<string>>();
    filteredRows.forEach((row) => {
      const originCode = String(row.ORIGIN || '').trim().toUpperCase();
      const destinationCode = String(row.DEST || '').trim().toUpperCase();
      if (!originCode || !destinationCode) return;
      originCodes.add(originCode);
      const destinations = destinationsByOrigin.get(originCode) ?? new Set<string>();
      destinations.add(destinationCode);
      destinationsByOrigin.set(originCode, destinations);
    });
    return { originCodes, destinationsByOrigin };
  }, [filteredRows]);

  const availableOriginCities = useMemo(
    () => Array.from(new Set(filteredRows.map((row) => String(row.ORIGIN_CITY_NAME || '').trim()).filter(Boolean))).sort(),
    [filteredRows],
  );
  const availableDestCities = useMemo(
    () => Array.from(new Set(
      filteredRows
        .filter((row) => String(row.ORIGIN || '').trim().toUpperCase() === origin)
        .map((row) => String(row.DEST_CITY_NAME || '').trim())
        .filter(Boolean),
    )).sort(),
    [filteredRows, origin],
  );

  // SELURUH BANDARA TANPA BATAS (FULL LIST)
  const filteredOriginAirports = useMemo(() => {
    return Object.values(allAirportsMap)
      .filter((ap) => {
        const availableInData = routeIndex.originCodes.has(ap.code);
        const matchCity = selectedOriginCity === 'Semua Kota' || ap.city === selectedOriginCity;
        const searchLower = originSearch.trim().toLowerCase();
        const matchSearch =
          !searchLower ||
          ap.name.toLowerCase().includes(searchLower) ||
          ap.city.toLowerCase().includes(searchLower) ||
          ap.code.toLowerCase().includes(searchLower);
        return availableInData && matchCity && matchSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allAirportsMap, routeIndex, selectedOriginCity, originSearch]);

  const filteredDestAirports = useMemo(() => {
    return Object.values(allAirportsMap)
      .filter((ap) => {
        const connectedFromOrigin = routeIndex.destinationsByOrigin.get(origin)?.has(ap.code) ?? false;
        const matchCity = selectedDestCity === 'Semua Kota' || ap.city === selectedDestCity;
        const searchLower = destSearch.trim().toLowerCase();
        const matchSearch =
          !searchLower ||
          ap.name.toLowerCase().includes(searchLower) ||
          ap.city.toLowerCase().includes(searchLower) ||
          ap.code.toLowerCase().includes(searchLower);
        return connectedFromOrigin && matchCity && matchSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allAirportsMap, routeIndex, origin, selectedDestCity, destSearch]);

  const updateRouteSelection = (nextOrigin: string, nextDestination: string) => {
    const originCity = allAirportsMap[nextOrigin]?.city || nextOrigin;
    const destinationCity = allAirportsMap[nextDestination]?.city || nextDestination;
    setRouteSelection(originCity, nextOrigin, destinationCity, nextDestination);
  };

  const startAp = useMemo(
    () => allAirportsMap[origin] || { code: origin, name: `Bandara ${origin}`, city: origin },
    [allAirportsMap, origin],
  );
  const endAp = useMemo(
    () => allAirportsMap[destination] || { code: destination, name: `Bandara ${destination}`, city: destination },
    [allAirportsMap, destination],
  );

  const routeStats = useMemo(() => {
    const matchingRows = filteredRows.filter((r) => {
      const origCode = String(r.ORIGIN || '').trim().toUpperCase();
      const destCode = String(r.DEST || '').trim().toUpperCase();
      return origCode === origin && destCode === destination;
    });

    let totalFlights = 0;
    let totalPassengers = 0;
    let totalSeats = 0;
    let delayedFlights = 0;
    let delayMinutesSum = 0;
    let distanceMilesTotal = 0;
    let distanceFlights = 0;
    const carrierCountMap: Record<string, number> = {};

    if (matchingRows.length > 0) {
      matchingRows.forEach((r) => {
        const flights = Number(r.DEPARTURES_PERFORMED || 0);
        const pax = Number(r.PASSENGERS || 0);
        const seats = Number(r.SEATS || 0);
        const delayed = Number(r.ARR_DELAY_FLIGHTS || 0);
        const delayMinutes = Number(r.TOTAL_ARR_DELAY_MINUTES || 0);
        const carrier = r.UNIQUE_CARRIER || 'Unknown';

        totalFlights += flights;
        totalPassengers += pax;
        totalSeats += seats;
        delayedFlights += delayed;
        delayMinutesSum += delayMinutes;
        const distanceMiles = Number(r.DISTANCE);
        if (Number.isFinite(distanceMiles) && distanceMiles > 0) {
          distanceMilesTotal += distanceMiles * flights;
          distanceFlights += flights;
        }

        carrierCountMap[carrier] = (carrierCountMap[carrier] || 0) + flights;
      });
    }

    const loadFactorPct = totalSeats > 0 ? Number(((totalPassengers / totalSeats) * 100).toFixed(1)) : 0;
    const delayRatePct = totalFlights > 0 ? Number(((delayedFlights / totalFlights) * 100).toFixed(1)) : 0;
    const onTimeRatePct = Number((100 - delayRatePct).toFixed(1));

    const avgDelayMinutes = delayedFlights > 0 ? Math.round(delayMinutesSum / delayedFlights) : 0;

    let topCarrier = '—';
    let maxCarrierCount = 0;
    Object.entries(carrierCountMap).forEach(([cName, count]) => {
      if (count > maxCarrierCount) {
        maxCarrierCount = count;
        topCarrier = cName;
      }
    });

    const displayFlights = totalFlights;
    const displayPassengers = totalPassengers;

    let delayStatusText = matchingRows.length === 0 ? 'TIDAK ADA DATA' : 'DELAY RENDAH';
    let delayStatusBadgeClass = matchingRows.length === 0
      ? 'bg-slate-500/10 border-slate-400/40 text-slate-400'
      : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-400';
    let delayStatusIcon = CheckCircle2;
    let insightSummary = matchingRows.length === 0
      ? `Tidak ada catatan untuk rute ${origin}–${destination} pada filter aktif. Pilih pasangan yang tersedia di data.`
      : `Rute ${origin}–${destination} memiliki delay rate ${delayRatePct}% dari ${totalFlights.toLocaleString('id-ID')} keberangkatan. Ini merupakan ringkasan historis agregat, bukan prediksi jadwal berikutnya.`;

    if (delayRatePct > 20) {
      delayStatusText = 'POTENSI DELAY TINGGI';
      delayStatusBadgeClass = 'bg-rose-500/10 border-rose-400/40 text-rose-400';
      delayStatusIcon = AlertTriangle;
      insightSummary = `Delay rate rute ${origin}–${destination} berada di atas 20% pada filter aktif. Periksa volume dan periode sebelum membandingkan; dataset tidak memiliki waktu keberangkatan untuk merekomendasikan jam tertentu.`;
    } else if (delayRatePct > 14) {
      delayStatusText = 'DELAY MODERAT';
      delayStatusBadgeClass = 'bg-amber-500/10 border-amber-400/40 text-amber-400';
      delayStatusIcon = AlertTriangle;
      insightSummary = `Delay rate rute ${origin}–${destination} berada pada rentang 14–20% pada filter aktif; bandingkan bersama volume dan load factor, bukan sebagai bukti sebab-akibat.`;
    }

    return {
      loadFactorPct,
      passengerDataNeedsReview: totalFlights > 0 && totalSeats > 0 && totalPassengers === 0,
      delayRatePct,
      onTimeRatePct,
      hasData: matchingRows.length > 0,
      avgDelayMinutes,
      topCarrier,
      displayFlights,
      displayPassengers,
      distanceKm: distanceFlights > 0
        ? Number(((distanceMilesTotal / distanceFlights) * 1.60934).toFixed(0))
        : null,
      delayStatusText,
      delayStatusBadgeClass,
      delayStatusIcon,
      insightSummary,
    };
  }, [filteredRows, origin, destination]);

  const hasMapCoordinates =
    Number.isFinite(startAp.lat) && Number.isFinite(startAp.lng) &&
    Number.isFinite(endAp.lat) && Number.isFinite(endAp.lng);

  const flightPathPoints = useMemo(() => {
    if (!hasMapCoordinates || startAp.lat == null || startAp.lng == null || endAp.lat == null || endAp.lng == null) {
      return [];
    }
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
  }, [hasMapCoordinates, startAp, endAp]);

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
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [38.5, -96.5],
        zoom: 4,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(TILE_URLS[mapType].url, {
      attribution: TILE_URLS[mapType].attribution,
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);
  }, [mapType]);

  // HANYA RENDER 2 MARKER BANDARA (ASAL & TUJUAN)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const group = markersGroupRef.current;
    group.clearLayers();
    planeMarkerRef.current = null;
    progressRef.current = 0;
    if (flightPathPoints.length < 2) return;

    const polyline = L.polyline(flightPathPoints, {
      color: '#06b6d4',
      weight: 3.5,
      dashArray: '8, 8',
      opacity: 0.9,
    }).addTo(group);

    mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [60, 60] });

    [startAp, endAp].forEach((ap) => {
      if (ap.lat == null || ap.lng == null) return;
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
  }, [flightPathPoints, startAp, endAp]);

  // ANIMASI MULUS DENGAN THROTTLED STATE TELEMETRI
  useEffect(() => {
    if (!isPlaying || !planeMarkerRef.current || flightPathPoints.length < 2) return;

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
            const altitudeFt =
              pct < 0.15
                ? Math.round((pct / 0.15) * 36000)
                : pct > 0.85
                  ? Math.round(((1 - pct) / 0.15) * 36000)
                  : 36000 + Math.round(Math.sin(pct * 20) * 400);
            const flightPhase =
              pct < 0.15
                ? 'Climb / Takeoff'
                : pct > 0.85
                  ? 'Descent / Landing'
                  : 'Cruising Alt (Jelajah)';

            setTelemetry({
              lat: Number(currentLat.toFixed(4)),
              lng: Number(currentLng.toFixed(4)),
              altitudeFt,
              speedKmh: Math.round(820 + Math.sin(pct * 10) * 30),
              bearingDeg: Math.round(bearing),
              progressPct: Math.round(pct * 100),
              flightPhase,
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
  }, [isPlaying, flightPathPoints, simSpeed]);

  const handleResetMapFocus = () => {
    if (mapInstanceRef.current && markersGroupRef.current && flightPathPoints.length > 1) {
      const polyline = L.polyline(flightPathPoints);
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [60, 60] });
    }
  };

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
                const reverseDestinations = routeIndex.destinationsByOrigin.get(destination);
                const nextDestination = reverseDestinations?.has(origin)
                  ? origin
                  : Array.from(reverseDestinations ?? [])[0];
                if (!nextDestination) return;
                const nextOriginCity = allAirportsMap[destination]?.city || destination;
                const nextDestinationCity = allAirportsMap[nextDestination]?.city || nextDestination;
                setRouteSelection(nextOriginCity, destination, nextDestinationCity, nextDestination);
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
                onChange={(e) => {
                  const city = e.target.value;
                  const candidateOrigins = filteredRows
                    .filter((row) => String(row.ORIGIN_CITY_NAME || '').trim() === city)
                    .map((row) => String(row.ORIGIN || '').trim().toUpperCase())
                    .filter(Boolean);
                  const uniqueOrigins = Array.from(new Set(candidateOrigins)).sort();
                  const nextOrigin = uniqueOrigins.includes(origin) ? origin : uniqueOrigins[0];
                  if (!nextOrigin) return;
                  const connectedRows = filteredRows.filter(
                    (row) => String(row.ORIGIN || '').trim().toUpperCase() === nextOrigin,
                  );
                  const nextDestinationRow = connectedRows.find(
                    (row) => String(row.DEST || '').trim().toUpperCase() === destination,
                  ) ?? connectedRows[0];
                  if (!nextDestinationRow) return;
                  const nextDestination = String(nextDestinationRow.DEST || '').trim().toUpperCase();
                  updateRouteSelection(nextOrigin, nextDestination);
                }}
                className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer w-full"
              >
                {availableOriginCities.map((city) => (
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
                  if (e.target.value !== destination) {
                    updateRouteSelection(e.target.value, destination);
                  }
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
                onChange={(e) => {
                  const city = e.target.value;
                  const connectedRows = filteredRows.filter(
                    (row) =>
                      String(row.ORIGIN || '').trim().toUpperCase() === origin &&
                      String(row.DEST_CITY_NAME || '').trim() === city,
                  );
                  const nextRow = connectedRows.find(
                    (row) => String(row.DEST || '').trim().toUpperCase() === destination,
                  ) ?? connectedRows[0];
                  if (!nextRow) return;
                  const nextDestination = String(nextRow.DEST || '').trim().toUpperCase();
                  updateRouteSelection(origin, nextDestination);
                }}
                className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer w-full"
              >
                {availableDestCities.map((city) => (
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
                  if (e.target.value !== origin) {
                    updateRouteSelection(origin, e.target.value);
                  }
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
              <Layers className="w-4 h-4 text-cyan-400" /> Visualisasi Koridor & Simulasi Rute
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
            <p className="text-[10px] leading-relaxed text-slate-400">
              Garis dan pesawat bergerak adalah simulasi visual rute terpilih, bukan pelacakan penerbangan langsung.
              Jarak memakai jarak segmen pada dataset (rata-rata berbobot keberangkatan) dan dikonversi dari mil ke kilometer.
            </p>
          </div>

          <div className="relative w-full h-[380px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            {!hasMapCoordinates && (
              <div className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-950/75 p-6 text-center">
                <p className="max-w-md text-xs leading-relaxed text-amber-200">
                  Koordinat bandara {startAp.code} atau {endAp.code} tidak tersedia. Rute tetap dapat dianalisis
                  dari data, tetapi tidak ditampilkan dengan posisi perkiraan di peta.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center gap-3">
              <Gauge className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Ketinggian</span>
                <span className="font-bold text-white">{hasMapCoordinates ? `${telemetry.altitudeFt.toLocaleString('id-ID')} ft` : '—'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center gap-3">
              <Zap className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Kecepatan Terbang</span>
                <span className="font-bold text-emerald-400">{hasMapCoordinates ? `${telemetry.speedKmh} km/h` : '—'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center gap-3">
              <Navigation className="w-5 h-5 text-violet-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Sudut Arah (Heading)</span>
                <span className="font-bold text-violet-300">{hasMapCoordinates ? `${telemetry.bearingDeg}° DEG` : '—'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Progres Simulasi</span>
                <span className="font-bold text-amber-400">
                  {hasMapCoordinates ? `${telemetry.progressPct}% (${telemetry.flightPhase})` : 'Koordinat tidak tersedia'}
                </span>
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
                <span className="text-cyan-400 font-bold">{hasMapCoordinates ? `${telemetry.progressPct}%` : '—'}</span>
                <span>{endAp.code}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-rose-400 transition-all duration-300"
                  style={{ width: hasMapCoordinates ? `${telemetry.progressPct}%` : '0%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" /> Load Factor
                </span>
                <div className="text-lg font-bold text-cyan-300">
                  {routeStats.passengerDataNeedsReview ? 'Perlu verifikasi' : `${routeStats.loadFactorPct}%`}
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden mt-1">
                  <div className="h-full bg-cyan-400" style={{ width: `${routeStats.loadFactorPct}%` }} />
                </div>
                <span className="text-[9px] text-slate-300 block pt-0.5">
                  {routeStats.passengerDataNeedsReview
                    ? 'Jumlah penumpang tercatat 0 sementara kursi tersedia'
                    : 'Keterisian Penumpang'}
                </span>
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
                <span className="text-slate-400">Total Keberangkatan:</span>
                <span className="font-bold text-white">{routeStats.displayFlights.toLocaleString('id-ID')}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Penumpang Tercatat:</span>
                <span className="font-bold text-white">{routeStats.displayPassengers.toLocaleString('id-ID')} pax</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Jarak Rute:</span>
                <span className="font-bold text-white">
                  {routeStats.distanceKm == null ? 'Tidak tersedia' : `${routeStats.distanceKm.toLocaleString('id-ID')} km`}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] leading-relaxed text-slate-300 font-sans">
              <strong className="text-cyan-300 font-mono block mb-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Ringkasan Insight Analis:
              </strong>
              {routeStats.insightSummary}
            </div>
            {routeStats.passengerDataNeedsReview && (
              <div className="flex gap-2 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] leading-relaxed text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <p>
                  Dataset mencatat {routeStats.displayFlights.toLocaleString('id-ID')} keberangkatan dan
                  memiliki kursi tersedia, tetapi nilai penumpang rute ini adalah 0. Angka keberangkatan dan
                  penumpang berasal dari kolom agregat yang berbeda; periksa sumber/kelengkapan data sebelum
                  menafsirkan angka 0 sebagai pesawat benar-benar kosong.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};