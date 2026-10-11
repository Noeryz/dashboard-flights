export interface AirportMeta {
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

// Standar Biaya Keterlambatan FAA APO-100
export const FAA_ECONOMIC_CONSTANTS = {
  AIRLINE_COST_PER_MIN_USD: 74.24,
  PASSENGER_TIME_COST_PER_MIN_USD: 37.44,
  TOTAL_COST_PER_MIN_USD: 111.68,
};

// Data Sensus US 2024 (Juta Jiwa) untuk Scatter Plot Atlanta Super-Hub
export const STATE_POPULATION_2024: Record<string, { popMillions: number; name: string }> = {
  CA: { popMillions: 38.9, name: 'California' },
  TX: { popMillions: 30.5, name: 'Texas' },
  FL: { popMillions: 23.0, name: 'Florida' },
  NY: { popMillions: 19.6, name: 'New York' },
  PA: { popMillions: 12.9, name: 'Pennsylvania' },
  IL: { popMillions: 12.5, name: 'Illinois' },
  OH: { popMillions: 11.8, name: 'Ohio' },
  GA: { popMillions: 11.1, name: 'Georgia' },
  NC: { popMillions: 10.8, name: 'North Carolina' },
  MI: { popMillions: 10.0, name: 'Michigan' },
  NJ: { popMillions: 9.3, name: 'New Jersey' },
  VA: { popMillions: 8.7, name: 'Virginia' },
  WA: { popMillions: 7.8, name: 'Washington' },
  AZ: { popMillions: 7.4, name: 'Arizona' },
  CO: { popMillions: 5.9, name: 'Colorado' },
  NV: { popMillions: 3.2, name: 'Nevada' },
  HI: { popMillions: 1.4, name: 'Hawaii' },
};

// Pemetaan Kode Maskapai Resmi
export const CARRIER_NAMES: Record<string, string> = {
  WN: 'Southwest Airlines (WN)',
  DL: 'Delta Air Lines (DL)',
  AA: 'American Airlines (AA)',
  UA: 'United Airlines (UA)',
  YX: 'Republic Airways (YX)',
  MQ: 'Envoy Air (MQ)',
  AS: 'Alaska Airlines (AS)',
  '9E': 'Endeavor Air (9E)',
  F9: 'Frontier Airlines (F9)',
  B6: 'JetBlue Airways (B6)',
  OH: 'PSA Airlines (OH)',
  G4: 'Allegiant Air (G4)',
  NK: 'Spirit Airlines (NK)',
  OO: 'SkyWest Airlines (OO)',
  HA: 'Hawaiian Airlines (HA)',
};

// Kamus Nama Resmi Bandara Utama AS
export const US_AIRPORT_NAMES: Record<string, string> = {
  ATL: 'Hartsfield-Jackson Atlanta International Airport',
  BOS: 'Boston Logan International Airport',
  BWI: 'Baltimore/Washington International Thurgood Marshall Airport',
  CLT: 'Charlotte Douglas International Airport',
  DCA: 'Ronald Reagan Washington National Airport',
  DEN: 'Denver International Airport',
  DFW: 'Dallas/Fort Worth International Airport',
  DTW: 'Detroit Metropolitan Wayne County Airport',
  EWR: 'Newark Liberty International Airport',
  FLL: 'Fort Lauderdale-Hollywood International Airport',
  IAD: 'Washington Dulles International Airport',
  IAH: 'George Bush Intercontinental Airport',
  JFK: 'John F. Kennedy International Airport',
  LAS: 'Harry Reid International Airport',
  LAX: 'Los Angeles International Airport',
  LGA: 'LaGuardia Airport',
  MCO: 'Orlando International Airport',
  MDW: 'Chicago Midway International Airport',
  MIA: 'Miami International Airport',
  MSP: 'Minneapolis-Saint Paul International Airport',
  ORD: "Chicago O'Hare International Airport",
  PHL: 'Philadelphia International Airport',
  PHX: 'Phoenix Sky Harbor International Airport',
  SAN: 'San Diego International Airport',
  SEA: 'Seattle-Tacoma International Airport',
  SFO: 'San Francisco International Airport',
  SLC: 'Salt Lake City International Airport',
  TPA: 'Tampa International Airport',
  BHM: 'Birmingham-Shuttlesworth International Airport',
  MKE: 'Milwaukee Mitchell International Airport',
  ANC: 'Ted Stevens Anchorage International Airport',
  AUS: 'Austin-Bergstrom International Airport',
  BNA: 'Nashville International Airport',
  CLE: 'Cleveland Hopkins International Airport',
  CVG: 'Cincinnati/Northern Kentucky International Airport',
  DAL: 'Dallas Love Field',
  HOU: 'William P. Hobby Airport',
  IND: 'Indianapolis International Airport',
  MCI: 'Kansas City International Airport',
  MEM: 'Memphis International Airport',
  MSY: 'Louis Armstrong New Orleans International Airport',
  OAK: 'San Francisco Bay Oakland International Airport',
  PDX: 'Portland International Airport',
  PIT: 'Pittsburgh International Airport',
  RDU: 'Raleigh-Durham International Airport',
  RSW: 'Southwest Florida International Airport',
  SAN: 'San Diego International Airport',
  SAT: 'San Antonio International Airport',
  SJC: 'Norman Y. Mineta San Jose International Airport',
  SJU: 'Luis Muñoz Marín International Airport',
  SMF: 'Sacramento International Airport',
  SNA: 'John Wayne Airport',
  STL: 'St. Louis Lambert International Airport',
};