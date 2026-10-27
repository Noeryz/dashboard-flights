import type { RawFlightRow } from '../types/flight';

export interface CorrelationResult {
  label: string;
  xLabel: string;
  rho: number;
  sampleSize: number;
  points: Array<{
    code: string;
    departures: number;
    logDepartures: number;
    loadFactor: number;
    delayRate: number;
    averageDelay: number;
  }>;
}

export interface FlightAnalysis {
  trafficDelay: CorrelationResult | null;
  delayRateDelay: CorrelationResult | null;
  loadDelay: CorrelationResult | null;
}

interface AirportProfile {
  code: string;
  departures: number;
  passengers: number;
  seats: number;
  delayedFlights: number;
  delayMinutes: number;
  averageDelayFlights: number;
  averageDelay: number;
  delayRate: number;
  loadFactor: number;
}

const MIN_AIRPORT_DEPARTURES = 1000;

const numberValue = (value: number | undefined): number => {
  const valueAsNumber = Number(value ?? 0);
  return Number.isFinite(valueAsNumber) ? valueAsNumber : 0;
};

export const getDelayDurationObservation = (row: RawFlightRow) => {
  const delayedFlights = numberValue(row.ARR_DELAY_FLIGHTS);
  const delayMinutes = numberValue(row.TOTAL_ARR_DELAY_MINUTES);
  const hasObservableDuration = delayedFlights > 0 && delayMinutes > 0;
  return {
    delayedFlights: hasObservableDuration ? delayedFlights : 0,
    delayMinutes: hasObservableDuration ? delayMinutes : 0,
  };
};

export const getDelayDurationDataQuality = (rows: RawFlightRow[]) => rows.reduce(
  (quality, row) => {
    const delayedFlights = numberValue(row.ARR_DELAY_FLIGHTS);
    const delayMinutes = numberValue(row.TOTAL_ARR_DELAY_MINUTES);
    if (delayedFlights > 0) {
      quality.recordsWithDelayedFlights += 1;
      quality.totalDelayedFlights += delayedFlights;
      if (delayMinutes <= 0) {
        quality.recordsWithoutDelayMinutes += 1;
        quality.delayedFlightsWithoutMinutes += delayedFlights;
      }
    }
    return quality;
  },
  {
    recordsWithDelayedFlights: 0,
    recordsWithoutDelayMinutes: 0,
    totalDelayedFlights: 0,
    delayedFlightsWithoutMinutes: 0,
  },
);

const aggregateAirportProfiles = (rows: RawFlightRow[]): AirportProfile[] => {
  const totals = new Map<string, Omit<AirportProfile, 'averageDelay' | 'delayRate' | 'loadFactor'>>();

  rows.forEach((row) => {
    const code = String(row.ORIGIN || '').trim().toUpperCase();
    if (!code) return;

    const aggregate = totals.get(code) ?? {
      code,
      departures: 0,
      passengers: 0,
      seats: 0,
      delayedFlights: 0,
      delayMinutes: 0,
      averageDelayFlights: 0,
    };
    aggregate.departures += numberValue(row.DEPARTURES_PERFORMED);
    aggregate.passengers += numberValue(row.PASSENGERS);
    aggregate.seats += numberValue(row.SEATS);
    const durationObservation = getDelayDurationObservation(row);
    aggregate.delayedFlights += numberValue(row.ARR_DELAY_FLIGHTS);
    aggregate.delayMinutes += durationObservation.delayMinutes;
    aggregate.averageDelayFlights += durationObservation.delayedFlights;
    totals.set(code, aggregate);
  });

  return Array.from(totals.values()).map((aggregate) => ({
    ...aggregate,
    averageDelay: aggregate.averageDelayFlights > 0
      ? aggregate.delayMinutes / aggregate.averageDelayFlights
      : 0,
    delayRate: aggregate.departures > 0
      ? (aggregate.delayedFlights / aggregate.departures) * 100
      : 0,
    loadFactor: aggregate.seats > 0
      ? (aggregate.passengers / aggregate.seats) * 100
      : 0,
  }));
};

const averageRanks = (values: number[]): number[] => {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);
  let start = 0;

  while (start < sorted.length) {
    let end = start + 1;
    while (end < sorted.length && sorted[end].value === sorted[start].value) end += 1;
    const averageRank = (start + 1 + end) / 2;
    for (let index = start; index < end; index += 1) {
      ranks[sorted[index].index] = averageRank;
    }
    start = end;
  }

  return ranks;
};

export const spearmanCorrelation = (x: number[], y: number[]): number | null => {
  if (x.length !== y.length || x.length < 3) return null;

  const rankedX = averageRanks(x);
  const rankedY = averageRanks(y);
  const meanRank = (rankedX.length + 1) / 2;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (let index = 0; index < rankedX.length; index += 1) {
    const deviationX = rankedX[index] - meanRank;
    const deviationY = rankedY[index] - meanRank;
    covariance += deviationX * deviationY;
    varianceX += deviationX ** 2;
    varianceY += deviationY ** 2;
  }

  if (varianceX === 0 || varianceY === 0) return null;
  return Math.max(-1, Math.min(1, covariance / Math.sqrt(varianceX * varianceY)));
};

const makeCorrelation = (
  label: string,
  xLabel: string,
  profiles: AirportProfile[],
  getX: (profile: AirportProfile) => number,
): CorrelationResult | null => {
  const eligible = profiles.filter(
    (profile) => profile.departures >= MIN_AIRPORT_DEPARTURES && profile.averageDelayFlights > 0,
  );
  const rho = spearmanCorrelation(
    eligible.map(getX),
    eligible.map((profile) => profile.averageDelay),
  );
  if (rho === null) return null;

  return {
    label,
    xLabel,
    rho,
    sampleSize: eligible.length,
    points: eligible.map((profile) => ({
      code: profile.code,
      departures: profile.departures,
      logDepartures: Math.log10(Math.max(1, profile.departures)),
      loadFactor: profile.loadFactor,
      delayRate: profile.delayRate,
      averageDelay: profile.averageDelay,
    })),
  };
};

export const analyzeFlights = (rows: RawFlightRow[]): FlightAnalysis => {
  const airports = aggregateAirportProfiles(rows);
  return {
    trafficDelay: makeCorrelation(
      'Volume keberangkatan dan rata-rata durasi keterlambatan',
      'Log10 keberangkatan',
      airports,
      (profile) => profile.departures,
    ),
    delayRateDelay: makeCorrelation(
      'Tingkat keterlambatan dan rata-rata durasi keterlambatan',
      'Tingkat keterlambatan (%)',
      airports,
      (profile) => profile.delayRate,
    ),
    loadDelay: makeCorrelation(
      'Load factor dan rata-rata durasi keterlambatan',
      'Load factor (%)',
      airports,
      (profile) => profile.loadFactor,
    ),
  };
};
