export type ActiveMenu =
  | 'OVERVIEW'
  | 'INSIGHTS'
  | 'AIRLINE'
  | 'ROUTE'
  | 'AIRPORT'
  | 'FACTORS'
  | 'RELATIONSHIPS'
  | 'METHODOLOGY';
export type ViewMode = 'public' | 'analyst';

export interface RawFlightRow {
  YEAR: number;
  MONTH: number;
  UNIQUE_CARRIER: string;
  ORIGIN: string;
  DEST: string;
  ORIGIN_CITY_NAME?: string;
  DEST_CITY_NAME?: string;
  DEPARTURES_PERFORMED: number;
  SCHEDULED_FLIGHTS: number;
  PASSENGERS: number;
  SEATS: number;
  FREIGHT?: number;
  DISTANCE?: number;
  CANCELLED_FLIGHTS: number;
  DIVERTED_FLIGHTS: number;
  ARR_DELAY_FLIGHTS: number;
  DEP_DELAY_FLIGHTS: number;
  TOTAL_ARR_DELAY_MINUTES: number;
  CARRIER_DELAY_MINUTES: number;
  WEATHER_DELAY_MINUTES: number;
  NAS_DELAY_MINUTES: number;
  SECURITY_DELAY_MINUTES: number;
  LATE_AIRCRAFT_DELAY_MINUTES: number;
  SEAT_LOAD_FACTOR?: number;
  DELAY_RATE?: number;
  CANCELLED_RATE?: number;
  OTP_RATE?: number;
  AVG_DELAY_MINUTES?: number;
}

export interface AirportCoord {
  iata: string;
  lat: number;
  lng: number;
}

export interface FilterState {
  year: string;
  month: string;
  carrier: string;
  originCity: string;
  origin: string;
  destinationCity: string;
  destination: string;
}

export interface DynamicKPIs {
  totalFlights: number;
  totalPassengers: number;
  delayRate: number;
  avgDelayMinutes: number;
  cancelRate: number;
  seatLoadFactor: number;
  otpRate: number;
  totalEconomicCostUSD: number;
}