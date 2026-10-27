import { create } from 'zustand';
import type { RawFlightRow, AirportCoord, ActiveMenu, ViewMode, FilterState, DynamicKPIs } from '../types/flight';
import { getDelayDurationObservation } from '../utils/flightAnalytics';

interface FlightStore {
  rawRows: RawFlightRow[];
  airportCoords: Record<string, AirportCoord>;
  activeMenu: ActiveMenu;
  viewMode: ViewMode;
  routeFilterEnabled: boolean;
  filters: FilterState;

  setRawRows: (rows: RawFlightRow[]) => void;
  setAirportCoords: (coords: Record<string, AirportCoord>) => void;
  setActiveMenu: (menu: ActiveMenu) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilter: (key: keyof FilterState, value: string) => void;
  setRouteSelection: (originCity: string, originApt: string, destCity: string, destApt: string) => void;
  resetFilters: () => void;
  swapRoute: () => void;

  getFilteredRows: () => RawFlightRow[];
  getFilteredRowsIgnoreCarrier: () => RawFlightRow[];
  getAvailableOriginCities: () => string[];
  getAirportsForOriginCity: (cityName: string) => { code: string; name: string }[];
  getAvailableDestinationCities: (originApt: string) => string[];
  getAirportsForDestinationCity: (originApt: string, destCityName: string) => { code: string; name: string }[];
  getCalculatedKPIs: () => DynamicKPIs;
}

const initialFilters: FilterState = {
  year: 'ALL',
  month: 'ALL',
  carrier: 'ALL',
  originCity: 'Atlanta, GA',
  origin: 'ATL',
  destinationCity: 'New York, NY',
  destination: 'JFK',
};

const normalizeFilterValue = (value: string | undefined): string => String(value ?? '').trim();

const matchesRouteFilter = (row: RawFlightRow, filters: FilterState): boolean => {
  const rowOrigin = normalizeFilterValue(row.ORIGIN).toUpperCase();
  const rowDestination = normalizeFilterValue(row.DEST).toUpperCase();
  const originFilter = normalizeFilterValue(filters.origin).toUpperCase();
  const destinationFilter = normalizeFilterValue(filters.destination).toUpperCase();

  if (originFilter && rowOrigin !== originFilter) return false;
  if (destinationFilter && rowDestination !== destinationFilter) return false;

  return true;
};

export const useFlightStore = create<FlightStore>((set, get) => ({
  rawRows: [],
  airportCoords: {},
  activeMenu: 'OVERVIEW',
  viewMode: 'public',
  routeFilterEnabled: false,
  filters: initialFilters,

  setRawRows: (rows) => set({ rawRows: rows || [] }),
  setAirportCoords: (coords) => set({ airportCoords: coords }),
  setActiveMenu: (menu) => set({ activeMenu: menu }),
  setViewMode: (mode) => set({ viewMode: mode }),

  setFilter: (key, value) => {
    const state = get();
    const newFilters = { ...state.filters, [key]: value };

    if (key === 'originCity') {
      const airports = state.getAirportsForOriginCity(value);
      const defaultApt = airports.length > 0 ? airports[0].code : 'ATL';
      newFilters.origin = defaultApt;
      const originAirport = state.rawRows.find((row) => String(row.ORIGIN || '').trim().toUpperCase() === defaultApt);
      if (originAirport && originAirport.ORIGIN_CITY_NAME) {
        newFilters.originCity = String(originAirport.ORIGIN_CITY_NAME).trim();
      }

      const destCities = state.getAvailableDestinationCities(defaultApt);
      const defaultDestCity = destCities.length > 0 ? destCities[0] : 'New York, NY';
      newFilters.destinationCity = defaultDestCity;

      const destAirports = state.getAirportsForDestinationCity(defaultApt, defaultDestCity);
      newFilters.destination = destAirports.length > 0 ? destAirports[0].code : 'JFK';
    } else if (key === 'origin') {
      const originAirport = state.rawRows.find((row) => String(row.ORIGIN || '').trim().toUpperCase() === value);
      if (originAirport && originAirport.ORIGIN_CITY_NAME) {
        newFilters.originCity = String(originAirport.ORIGIN_CITY_NAME).trim();
      }

      const destCities = state.getAvailableDestinationCities(value);
      const defaultDestCity = destCities.length > 0 ? destCities[0] : 'New York, NY';
      newFilters.destinationCity = defaultDestCity;

      const destAirports = state.getAirportsForDestinationCity(value, defaultDestCity);
      newFilters.destination = destAirports.length > 0 ? destAirports[0].code : 'JFK';
    } else if (key === 'destinationCity') {
      const destAirports = state.getAirportsForDestinationCity(newFilters.origin, value);
      newFilters.destination = destAirports.length > 0 ? destAirports[0].code : 'JFK';
      const destinationAirport = state.rawRows.find(
        (row) => String(row.DEST || '').trim().toUpperCase() === newFilters.destination,
      );
      if (destinationAirport && destinationAirport.DEST_CITY_NAME) {
        newFilters.destinationCity = String(destinationAirport.DEST_CITY_NAME).trim();
      }
    } else if (key === 'destination') {
      const destinationAirport = state.rawRows.find(
        (row) => String(row.DEST || '').trim().toUpperCase() === value,
      );
      if (destinationAirport && destinationAirport.DEST_CITY_NAME) {
        newFilters.destinationCity = String(destinationAirport.DEST_CITY_NAME).trim();
      }
    }

    const routeFilterEnabled = state.routeFilterEnabled || [
      'originCity',
      'origin',
      'destinationCity',
      'destination',
    ].includes(key);
    set({ filters: newFilters, routeFilterEnabled });
  },

  setRouteSelection: (originCity, originApt, destCity, destApt) => {
    set((state) => ({
      routeFilterEnabled: true,
      filters: {
        ...state.filters,
        originCity,
        origin: originApt,
        destinationCity: destCity,
        destination: destApt,
      },
    }));
  },

  resetFilters: () => set({ filters: initialFilters, routeFilterEnabled: false }),

  swapRoute: () => {
    const { filters, getAvailableDestinationCities, getAirportsForDestinationCity } = get();
    const newOriginCity = filters.destinationCity;
    const newOriginApt = filters.destination;

    const availableDestCities = getAvailableDestinationCities(newOriginApt);
    let newDestCity = filters.originCity;
    if (availableDestCities.length > 0 && !availableDestCities.includes(newDestCity)) {
      newDestCity = availableDestCities[0];
    }

    const availableDestAirports = getAirportsForDestinationCity(newOriginApt, newDestCity);
    let newDestApt = filters.origin;
    if (availableDestAirports.length > 0 && !availableDestAirports.some((a) => a.code === newDestApt)) {
      newDestApt = availableDestAirports[0].code;
    }

    set({
      routeFilterEnabled: true,
      filters: {
        ...filters,
        originCity: newOriginCity,
        origin: newOriginApt,
        destinationCity: newDestCity,
        destination: newDestApt,
      },
    });
  },

  getAvailableOriginCities: () => {
    const { rawRows } = get();
    if (!rawRows || rawRows.length === 0) return [];
    const cities = new Set<string>();
    rawRows.forEach((r) => {
      if (r.ORIGIN_CITY_NAME) cities.add(String(r.ORIGIN_CITY_NAME).trim());
    });
    return Array.from(cities).sort();
  },

  getAirportsForOriginCity: (cityName) => {
    const { rawRows } = get();
    if (!rawRows || rawRows.length === 0) return [];
    const aptMap = new Map<string, string>();
    rawRows.forEach((r) => {
      if (r.ORIGIN_CITY_NAME && String(r.ORIGIN_CITY_NAME).trim() === cityName.trim()) {
        const code = String(r.ORIGIN).trim();
        if (!aptMap.has(code)) {
          aptMap.set(code, `${code} — ${cityName}`);
        }
      }
    });
    return Array.from(aptMap.entries()).map(([code, name]) => ({ code, name }));
  },

  getAvailableDestinationCities: (originApt) => {
    const { rawRows } = get();
    if (!rawRows || rawRows.length === 0) return [];
    const cities = new Set<string>();
    rawRows.forEach((r) => {
      if (String(r.ORIGIN).trim() === originApt.trim() && r.DEST_CITY_NAME) {
        cities.add(String(r.DEST_CITY_NAME).trim());
      }
    });
    return Array.from(cities).sort();
  },

  getAirportsForDestinationCity: (originApt, destCityName) => {
    const { rawRows } = get();
    if (!rawRows || rawRows.length === 0) return [];
    const aptMap = new Map<string, string>();
    rawRows.forEach((r) => {
      if (
        String(r.ORIGIN).trim() === originApt.trim() &&
        r.DEST_CITY_NAME &&
        String(r.DEST_CITY_NAME).trim() === destCityName.trim()
      ) {
        const code = String(r.DEST).trim();
        if (!aptMap.has(code)) {
          aptMap.set(code, `${code} — ${destCityName}`);
        }
      }
    });
    return Array.from(aptMap.entries()).map(([code, name]) => ({ code, name }));
  },

  getFilteredRows: () => {
    const { rawRows, filters, routeFilterEnabled } = get();
    if (!rawRows || rawRows.length === 0) return [];

    return rawRows.filter((row) => {
      const rowYear = String(row.YEAR || '');
      const rowMonth = String(row.MONTH || '');
      const rowCarrier = String(row.UNIQUE_CARRIER || '').trim().toUpperCase();

      if (filters.year !== 'ALL' && rowYear !== filters.year) return false;
      if (filters.month !== 'ALL' && rowMonth !== filters.month) return false;
      if (filters.carrier !== 'ALL' && rowCarrier !== filters.carrier) return false;
      if (routeFilterEnabled && !matchesRouteFilter(row, filters)) return false;

      return true;
    });
  },

  getFilteredRowsIgnoreCarrier: () => {
    const { rawRows, filters, routeFilterEnabled } = get();
    if (!rawRows || rawRows.length === 0) return [];

    return rawRows.filter((row) => {
      const rowYear = String(row.YEAR || '');
      const rowMonth = String(row.MONTH || '');

      if (filters.year !== 'ALL' && rowYear !== filters.year) return false;
      if (filters.month !== 'ALL' && rowMonth !== filters.month) return false;
      if (routeFilterEnabled && !matchesRouteFilter(row, filters)) return false;

      return true;
    });
  },

  getCalculatedKPIs: () => {
    const filtered = get().getFilteredRows();
    if (!filtered || filtered.length === 0) {
      return {
        totalFlights: 0,
        totalPassengers: 0,
        delayRate: 0,
        avgDelayMinutes: null,
        cancelRate: 0,
        seatLoadFactor: 0,
        otpRate: 0,
        totalEconomicCostUSD: 0,
      };
    }

    let totalFlights = 0;
    let totalPassengers = 0;
    let totalSeats = 0;
    let totalScheduled = 0;
    let totalCancelled = 0;
    let totalDelayed = 0;
    let totalDelayMinutesSum = 0;
    let observedDelayedFlights = 0;
    let observedDelayMinutesSum = 0;

    for (let i = 0; i < filtered.length; i++) {
      const row = filtered[i];
      const departures = Number(row.DEPARTURES_PERFORMED || 0);
      const scheduled = Number(row.SCHEDULED_FLIGHTS || departures);

      totalFlights += departures;
      totalPassengers += Number(row.PASSENGERS || 0);
      totalSeats += Number(row.SEATS || 0);
      totalScheduled += scheduled;
      totalCancelled += Number(row.CANCELLED_FLIGHTS || 0);
      totalDelayed += Number(row.ARR_DELAY_FLIGHTS || 0);
      totalDelayMinutesSum += Number(row.TOTAL_ARR_DELAY_MINUTES || 0);
      const durationObservation = getDelayDurationObservation(row);
      observedDelayedFlights += durationObservation.delayedFlights;
      observedDelayMinutesSum += durationObservation.delayMinutes;
    }

    const delayRate = totalFlights > 0 ? (totalDelayed / totalFlights) * 100 : 0;
    const cancelRate = totalScheduled > 0 ? (totalCancelled / totalScheduled) * 100 : 0;
    const seatLoadFactor = totalSeats > 0 ? Math.min(100, (totalPassengers / totalSeats) * 100) : 0;
    const avgDelayMinutes = observedDelayedFlights > 0
      ? observedDelayMinutesSum / observedDelayedFlights
      : null;
    const otpRate = Math.max(0, 100 - delayRate);
    const totalEconomicCostUSD = totalDelayMinutesSum * 111.68;

    return {
      totalFlights: Math.round(totalFlights),
      totalPassengers: Math.round(totalPassengers),
      delayRate: Number(delayRate.toFixed(2)),
      avgDelayMinutes: avgDelayMinutes == null ? null : Number(avgDelayMinutes.toFixed(2)),
      cancelRate: Number(cancelRate.toFixed(2)),
      seatLoadFactor: Number(seatLoadFactor.toFixed(2)),
      otpRate: Number(otpRate.toFixed(2)),
      totalEconomicCostUSD: Math.round(totalEconomicCostUSD),
    };
  },
}));