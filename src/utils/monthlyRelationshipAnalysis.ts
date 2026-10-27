import type { FilterState, RawFlightRow } from '../types/flight';
import { spearmanCorrelation } from './flightAnalytics';

export interface RelationshipPoint {
  x: number;
  y: number;
  count: number;
}

export interface MonthlyCorrelation {
  rho: number | null;
  sampleSize: number;
  points: RelationshipPoint[];
}

export interface CarrierComparison {
  carrier: string;
  delayRate: number;
  cancellationRate: number;
  departures: number;
  scheduled: number;
}

export interface DelayCategoryTotal {
  category: string;
  minutes: number;
  share: number;
}

export interface YearComparison {
  matchedRouteMonths: number;
  delayRate2024: number;
  delayRate2025: number;
  cancellationRate2024: number;
  cancellationRate2025: number;
  departures2024: number;
  departures2025: number;
  scheduled2024: number;
  scheduled2025: number;
}

const numberValue = (value: number | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRate = (numerator: number, denominator: number): number =>
  denominator > 0 ? (numerator / denominator) * 100 : 0;

const makeQuantilePoints = (x: number[], y: number[], binCount = 24): RelationshipPoint[] => {
  const pairs = x.map((value, index) => ({ x: value, y: y[index] }))
    .sort((left, right) => left.x - right.x);
  const actualBinCount = Math.min(binCount, pairs.length);

  return Array.from({ length: actualBinCount }, (_, bin) => {
    const start = Math.floor((bin * pairs.length) / actualBinCount);
    const end = Math.floor(((bin + 1) * pairs.length) / actualBinCount);
    const values = pairs.slice(start, end);
    return {
      x: values.reduce((sum, point) => sum + point.x, 0) / values.length,
      y: values.reduce((sum, point) => sum + point.y, 0) / values.length,
      count: values.length,
    };
  });
};

const correlate = (
  pairs: Array<{ x: number; y: number }>,
): MonthlyCorrelation => {
  const validPairs = pairs.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  return {
    rho: spearmanCorrelation(
      validPairs.map((point) => point.x),
      validPairs.map((point) => point.y),
    ),
    sampleSize: validPairs.length,
    points: makeQuantilePoints(
      validPairs.map((point) => point.x),
      validPairs.map((point) => point.y),
    ),
  };
};

const delayRate = (row: RawFlightRow): number =>
  getRate(numberValue(row.ARR_DELAY_FLIGHTS), numberValue(row.DEPARTURES_PERFORMED));

const cancellationRate = (row: RawFlightRow): number =>
  getRate(numberValue(row.CANCELLED_FLIGHTS), numberValue(row.SCHEDULED_FLIGHTS));

const getRowMonth = (row: RawFlightRow): number =>
  Number(row.YEAR) * 12 + Number(row.MONTH);

export const analyzeMonthlyRelationships = (
  rows: RawFlightRow[],
  allRows: RawFlightRow[] = rows,
) => {
  const validScheduled = rows.filter((row) => numberValue(row.SCHEDULED_FLIGHTS) > 0);
  const validLoad = rows.filter((row) => numberValue(row.SEATS) > 0);
  const validDistanceDuration = rows.filter((row) =>
    numberValue(row.DISTANCE) > 0
      && numberValue(row.ARR_DELAY_FLIGHTS) > 0
      && numberValue(row.TOTAL_ARR_DELAY_MINUTES) > 0,
  );
  const previousMonthByRoute = new Map<string, RawFlightRow>();
  allRows.forEach((row) => {
    const key = `${row.UNIQUE_CARRIER}|${row.ORIGIN}|${row.DEST}|${getRowMonth(row)}`;
    previousMonthByRoute.set(key, row);
  });
  const laggedPairs: Array<{ x: number; y: number }> = [];
  rows.forEach((row) => {
    const previousMonth = getRowMonth(row) - 1;
    const key = `${row.UNIQUE_CARRIER}|${row.ORIGIN}|${row.DEST}|${previousMonth}`;
    const previous = previousMonthByRoute.get(key);
    if (
      previous
      && numberValue(previous.DEPARTURES_PERFORMED) > 0
      && numberValue(row.DEPARTURES_PERFORMED) > 0
    ) {
      laggedPairs.push({ x: delayRate(previous), y: delayRate(row) });
    }
  });

  const distanceByRoute = new Map<string, { distance: number; minutes: number; delayedFlights: number }>();
  validDistanceDuration.forEach((row) => {
    const route = `${row.ORIGIN}-${row.DEST}`;
    const aggregate = distanceByRoute.get(route) ?? {
      distance: numberValue(row.DISTANCE),
      minutes: 0,
      delayedFlights: 0,
    };
    aggregate.minutes += numberValue(row.TOTAL_ARR_DELAY_MINUTES);
    aggregate.delayedFlights += numberValue(row.ARR_DELAY_FLIGHTS);
    distanceByRoute.set(route, aggregate);
  });

  const routePairs = Array.from(distanceByRoute.values())
    .filter((route) => route.delayedFlights > 0)
    .map((route) => ({
      x: route.distance,
      y: route.minutes / route.delayedFlights,
    }));

  const categories: Array<{ category: string; getMinutes: (row: RawFlightRow) => number }> = [
    { category: 'Cuaca', getMinutes: (row) => numberValue(row.WEATHER_DELAY_MINUTES) },
    { category: 'Maskapai', getMinutes: (row) => numberValue(row.CARRIER_DELAY_MINUTES) },
    { category: 'Sistem penerbangan (NAS)', getMinutes: (row) => numberValue(row.NAS_DELAY_MINUTES) },
    { category: 'Keamanan', getMinutes: (row) => numberValue(row.SECURITY_DELAY_MINUTES) },
    { category: 'Pesawat terlambat sebelumnya', getMinutes: (row) => numberValue(row.LATE_AIRCRAFT_DELAY_MINUTES) },
  ];
  const categoryTotals = categories.map(({ category, getMinutes }) => ({
    category,
    minutes: rows.reduce((sum, row) => sum + getMinutes(row), 0),
    share: 0,
  }));
  const totalCategoryMinutes = categoryTotals.reduce((sum, category) => sum + category.minutes, 0);
  categoryTotals.forEach((category) => {
    category.share = getRate(category.minutes, totalCategoryMinutes);
  });

  const carrierTotals = new Map<string, { delayed: number; departures: number; cancelled: number; scheduled: number }>();
  rows.forEach((row) => {
    const carrier = String(row.UNIQUE_CARRIER || '').trim();
    if (!carrier) return;
    const total = carrierTotals.get(carrier) ?? { delayed: 0, departures: 0, cancelled: 0, scheduled: 0 };
    total.delayed += numberValue(row.ARR_DELAY_FLIGHTS);
    total.departures += numberValue(row.DEPARTURES_PERFORMED);
    total.cancelled += numberValue(row.CANCELLED_FLIGHTS);
    total.scheduled += numberValue(row.SCHEDULED_FLIGHTS);
    carrierTotals.set(carrier, total);
  });
  const eligibleCarriers: CarrierComparison[] = Array.from(carrierTotals, ([carrier, totals]) => ({
    carrier,
    delayRate: getRate(totals.delayed, totals.departures),
    cancellationRate: getRate(totals.cancelled, totals.scheduled),
    departures: totals.departures,
    scheduled: totals.scheduled,
  }))
    .filter((carrier) => carrier.scheduled >= 10000);
  const carriersByCancellation = [...eligibleCarriers]
    .sort((left, right) => right.cancellationRate - left.cancellationRate)
    .slice(0, 10);
  const carriersByDelay = [...eligibleCarriers]
    .sort((left, right) => right.delayRate - left.delayRate)
    .slice(0, 10);

  return {
    correlations: {
      scheduleAndDelay: correlate(validScheduled.map((row) => ({
        x: numberValue(row.SCHEDULED_FLIGHTS),
        y: delayRate(row),
      }))),
      loadAndDelay: correlate(validLoad.map((row) => ({
        x: getRate(numberValue(row.PASSENGERS), numberValue(row.SEATS)),
        y: delayRate(row),
      }))),
      distanceAndDuration: correlate(routePairs),
      previousAndCurrentDelay: correlate(laggedPairs),
      cancellationAndDelay: correlate(validScheduled.map((row) => ({
        x: cancellationRate(row),
        y: delayRate(row),
      }))),
      diversionAndDelay: correlate(rows.filter((row) => numberValue(row.DEPARTURES_PERFORMED) > 0).map((row) => ({
        x: getRate(numberValue(row.DIVERTED_FLIGHTS), numberValue(row.DEPARTURES_PERFORMED)),
        y: delayRate(row),
      }))),
    },
    categories: categoryTotals,
    categoryMinutesTotal: totalCategoryMinutes,
    carriersByCancellation,
    carriersByDelay,
  };
};

export const compareMatchedYears = (
  rows: RawFlightRow[],
  filters: FilterState,
  routeFilterEnabled: boolean,
): YearComparison | null => {
  const matchingRows = rows.filter((row) => {
    if (filters.month !== 'ALL' && String(row.MONTH) !== filters.month) return false;
    if (filters.carrier !== 'ALL' && String(row.UNIQUE_CARRIER).trim().toUpperCase() !== filters.carrier) return false;
    if (routeFilterEnabled) {
      if (String(row.ORIGIN).trim().toUpperCase() !== filters.origin.toUpperCase()) return false;
      if (String(row.DEST).trim().toUpperCase() !== filters.destination.toUpperCase()) return false;
    }
    return Number(row.YEAR) === 2024 || Number(row.YEAR) === 2025;
  });
  const matched = new Map<string, { 2024?: RawFlightRow; 2025?: RawFlightRow }>();

  matchingRows.forEach((row) => {
    const key = `${row.UNIQUE_CARRIER}|${row.ORIGIN}|${row.DEST}|${row.MONTH}`;
    const pair = matched.get(key) ?? {};
    pair[Number(row.YEAR) as 2024 | 2025] = row;
    matched.set(key, pair);
  });

  const pairs = Array.from(matched.values()).filter(
    (pair): pair is { 2024: RawFlightRow; 2025: RawFlightRow } => Boolean(pair[2024] && pair[2025]),
  );
  if (!pairs.length) return null;

  const totals = {
    2024: { delayed: 0, departures: 0, cancelled: 0, scheduled: 0 },
    2025: { delayed: 0, departures: 0, cancelled: 0, scheduled: 0 },
  };
  pairs.forEach((pair) => {
    ([2024, 2025] as const).forEach((year) => {
      const row = pair[year];
      totals[year].delayed += numberValue(row.ARR_DELAY_FLIGHTS);
      totals[year].departures += numberValue(row.DEPARTURES_PERFORMED);
      totals[year].cancelled += numberValue(row.CANCELLED_FLIGHTS);
      totals[year].scheduled += numberValue(row.SCHEDULED_FLIGHTS);
    });
  });

  return {
    matchedRouteMonths: pairs.length,
    delayRate2024: getRate(totals[2024].delayed, totals[2024].departures),
    delayRate2025: getRate(totals[2025].delayed, totals[2025].departures),
    cancellationRate2024: getRate(totals[2024].cancelled, totals[2024].scheduled),
    cancellationRate2025: getRate(totals[2025].cancelled, totals[2025].scheduled),
    departures2024: totals[2024].departures,
    departures2025: totals[2025].departures,
    scheduled2024: totals[2024].scheduled,
    scheduled2025: totals[2025].scheduled,
  };
};
