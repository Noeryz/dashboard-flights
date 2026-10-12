import type { RawFlightRow } from '../types/flight';

export interface EntityProfile {
  code: string;
  departures: number;
  passengers: number;
  seats: number;
  delayedFlights: number;
  delayMinutes: number;
  cancelledFlights: number;
  averageDelay: number;
  delayRate: number;
  loadFactor: number;
  cancellationRate: number;
}

export interface CorrelationResult {
  label: string;
  xLabel: string;
  yLabel: string;
  rho: number;
  pValue: number;
  sampleSize: number;
  points: Array<{
    code: string;
    departures: number;
    logDepartures: number;
    loadFactor: number;
    averageDelay: number;
    delayRate: number;
  }>;
}

export interface SeasonalityResult {
  summerAverageDelay: number;
  otherAverageDelay: number;
  difference: number;
  pValue: number;
  sampleSize: number;
}

export interface ClusterSummary {
  id: number;
  label: string;
  count: number;
  departures: number;
  averageDelay: number;
  delayRate: number;
  loadFactor: number;
  cancellationRate: number;
}

export interface SegmentationResult {
  entities: Array<EntityProfile & { cluster: number }>;
  clusters: ClusterSummary[];
}

export interface DelayModelResult {
  trainingRows: number;
  testRows: number;
  testPeriod: string;
  mae: number;
  baselineMae: number;
  rSquared: number;
  modelName: string;
}

export interface FlightAnalysis {
  trafficDelay: CorrelationResult | null;
  loadDelay: CorrelationResult | null;
  seasonality: SeasonalityResult | null;
  airportSegments: SegmentationResult;
  carrierSegments: SegmentationResult;
  delayModel: DelayModelResult | null;
}

const MIN_AIRPORT_DEPARTURES = 1000;
const SUMMER_MONTHS = new Set([6, 7, 8]);

const numberValue = (value: number | undefined): number => {
  const valueAsNumber = Number(value ?? 0);
  return Number.isFinite(valueAsNumber) ? valueAsNumber : 0;
};

const averageDelayFor = (delayMinutes: number, delayedFlights: number): number =>
  delayedFlights > 0 ? delayMinutes / delayedFlights : 0;

const aggregateProfiles = (
  rows: RawFlightRow[],
  getCode: (row: RawFlightRow) => string,
): EntityProfile[] => {
  const totals = new Map<string, Omit<EntityProfile, 'averageDelay' | 'delayRate' | 'loadFactor' | 'cancellationRate'>>();

  rows.forEach((row) => {
    const code = getCode(row).trim();
    if (!code) return;
    const aggregate = totals.get(code) ?? {
      code,
      departures: 0,
      passengers: 0,
      seats: 0,
      delayedFlights: 0,
      delayMinutes: 0,
      cancelledFlights: 0,
    };
    aggregate.departures += numberValue(row.DEPARTURES_PERFORMED);
    aggregate.passengers += numberValue(row.PASSENGERS);
    aggregate.seats += numberValue(row.SEATS);
    aggregate.delayedFlights += numberValue(row.ARR_DELAY_FLIGHTS);
    aggregate.delayMinutes += numberValue(row.TOTAL_ARR_DELAY_MINUTES);
    aggregate.cancelledFlights += numberValue(row.CANCELLED_FLIGHTS);
    totals.set(code, aggregate);
  });

  return Array.from(totals.values()).map((aggregate) => ({
    ...aggregate,
    averageDelay: averageDelayFor(aggregate.delayMinutes, aggregate.delayedFlights),
    delayRate: aggregate.departures > 0
      ? (aggregate.delayedFlights / aggregate.departures) * 100
      : 0,
    loadFactor: aggregate.seats > 0
      ? (aggregate.passengers / aggregate.seats) * 100
      : 0,
    cancellationRate: aggregate.departures + aggregate.cancelledFlights > 0
      ? (aggregate.cancelledFlights / (aggregate.departures + aggregate.cancelledFlights)) * 100
      : 0,
  }));
};

const averageRanks = (values: number[]): number[] => {
  const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
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

const logGamma = (value: number): number => {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }
  const shifted = value - 1;
  let sum = 0.99999999999980993;
  coefficients.forEach((coefficient, index) => {
    sum += coefficient / (shifted + index + 1);
  });
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(sum);
};

const betaContinuedFraction = (a: number, b: number, x: number): number => {
  const maxIterations = 120;
  const epsilon = 3e-14;
  const tiny = 1e-300;
  const sum = a + b;
  const aPlusOne = a + 1;
  const aMinusOne = a - 1;
  let c = 1;
  let d = 1 - (sum * x) / aPlusOne;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let result = d;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const twice = 2 * iteration;
    let coefficient =
      (iteration * (b - iteration) * x) /
      ((aMinusOne + twice) * (a + twice));
    d = 1 + coefficient * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + coefficient / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    result *= d * c;

    coefficient =
      (-(a + iteration) * (sum + iteration) * x) /
      ((a + twice) * (aPlusOne + twice));
    d = 1 + coefficient * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + coefficient / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    result *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }

  return result;
};

const regularizedBeta = (x: number, a: number, b: number): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) +
    a * Math.log(x) + b * Math.log1p(-x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betaContinuedFraction(a, b, x)) / a;
  }
  return 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
};

const twoSidedTProbability = (statistic: number, degreesOfFreedom: number): number => {
  if (!Number.isFinite(statistic) || degreesOfFreedom <= 0) return 1;
  const x = degreesOfFreedom / (degreesOfFreedom + statistic * statistic);
  return Math.max(0, Math.min(1, regularizedBeta(x, degreesOfFreedom / 2, 0.5)));
};

const spearman = (x: number[], y: number[]): { rho: number; pValue: number } | null => {
  if (x.length !== y.length || x.length < 3) return null;
  const rankedX = averageRanks(x);
  const rankedY = averageRanks(y);
  const meanX = (rankedX.length + 1) / 2;
  const meanY = (rankedY.length + 1) / 2;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let index = 0; index < rankedX.length; index += 1) {
    const dx = rankedX[index] - meanX;
    const dy = rankedY[index] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  if (varianceX === 0 || varianceY === 0) return null;
  const rho = Math.max(-1, Math.min(1, covariance / Math.sqrt(varianceX * varianceY)));
  const statistic = Math.abs(rho) === 1
    ? Number.POSITIVE_INFINITY
    : rho * Math.sqrt((x.length - 2) / (1 - rho * rho));
  return {
    rho,
    pValue: twoSidedTProbability(statistic, x.length - 2),
  };
};

const makeCorrelation = (
  label: string,
  xLabel: string,
  profiles: EntityProfile[],
  getX: (profile: EntityProfile) => number,
): CorrelationResult | null => {
  const eligible = profiles.filter(
    (profile) => profile.departures >= MIN_AIRPORT_DEPARTURES &&
      profile.delayedFlights > 0 &&
      profile.seats > 0,
  );
  const result = spearman(
    eligible.map(getX),
    eligible.map((profile) => profile.averageDelay),
  );
  if (!result) return null;
  return {
    label,
    xLabel,
    yLabel: 'Rata-rata menit keterlambatan kedatangan',
    ...result,
    sampleSize: eligible.length,
    points: eligible.map((profile) => ({
      code: profile.code,
      departures: profile.departures,
      logDepartures: Math.log10(Math.max(1, profile.departures)),
      loadFactor: profile.loadFactor,
      averageDelay: profile.averageDelay,
      delayRate: profile.delayRate,
    })),
  };
};

const calculateSeasonality = (rows: RawFlightRow[]): SeasonalityResult | null => {
  const airportMonths = new Map<string, {
    summerMinutes: number;
    summerDelayed: number;
    otherMinutes: number;
    otherDelayed: number;
    departures: number;
  }>();
  for (const row of rows) {
    const code = row.ORIGIN.trim();
    const stats = airportMonths.get(code) ?? {
      summerMinutes: 0,
      summerDelayed: 0,
      otherMinutes: 0,
      otherDelayed: 0,
      departures: 0,
    };
    const month = numberValue(row.MONTH);
    const minutes = numberValue(row.TOTAL_ARR_DELAY_MINUTES);
    const delayed = numberValue(row.ARR_DELAY_FLIGHTS);
    stats.departures += numberValue(row.DEPARTURES_PERFORMED);
    if (SUMMER_MONTHS.has(month)) {
      stats.summerMinutes += minutes;
      stats.summerDelayed += delayed;
    } else {
      stats.otherMinutes += minutes;
      stats.otherDelayed += delayed;
    }
    airportMonths.set(code, stats);
  }
  const paired = Array.from(airportMonths.values()).filter(
    (stats) => stats.departures >= MIN_AIRPORT_DEPARTURES &&
      stats.summerDelayed > 0 &&
      stats.otherDelayed > 0,
  );
  if (paired.length < 3) return null;

  const summerMeans = paired.map((stats) => stats.summerMinutes / stats.summerDelayed);
  const otherMeans = paired.map((stats) => stats.otherMinutes / stats.otherDelayed);
  const differences = paired.map((_, index) => summerMeans[index] - otherMeans[index]);
  const difference = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  const variance = differences.reduce((sum, value) => sum + (value - difference) ** 2, 0) /
    (differences.length - 1);
  const standardError = Math.sqrt(variance / differences.length);
  const statistic = standardError > 0 ? difference / standardError : Number.POSITIVE_INFINITY;

  return {
    summerAverageDelay: summerMeans.reduce((sum, value) => sum + value, 0) / summerMeans.length,
    otherAverageDelay: otherMeans.reduce((sum, value) => sum + value, 0) / otherMeans.length,
    difference,
    pValue: twoSidedTProbability(statistic, differences.length - 1),
    sampleSize: differences.length,
  };
};

const clusterProfiles = (profiles: EntityProfile[]): SegmentationResult => {
  const included = profiles.filter((profile) => profile.departures > 0);
  if (included.length === 0) return { entities: [], clusters: [] };
  const rawFeatures = included.map((profile) => [
    Math.log1p(profile.departures),
    profile.averageDelay,
    profile.loadFactor,
    profile.cancellationRate,
  ]);
  const means = rawFeatures[0].map(
    (_, column) => rawFeatures.reduce((sum, values) => sum + values[column], 0) / rawFeatures.length,
  );
  const deviations = rawFeatures[0].map((_, column) => {
    const variance = rawFeatures.reduce(
      (sum, values) => sum + (values[column] - means[column]) ** 2,
      0,
    ) / rawFeatures.length;
    return Math.sqrt(variance) || 1;
  });
  const points = rawFeatures.map((values) =>
    values.map((value, index) => (value - means[index]) / deviations[index]),
  );
  const sortedIndexes = included
    .map((profile, index) => ({ departures: profile.departures, index }))
    .sort((a, b) => a.departures - b.departures);
  const centerPositions = [0.15, 0.5, 0.85].map((fraction) =>
    sortedIndexes[Math.min(sortedIndexes.length - 1, Math.floor((sortedIndexes.length - 1) * fraction))].index,
  );
  const centers = centerPositions.map((index) => [...points[index]]);
  const assignments = new Array<number>(included.length).fill(0);

  for (let iteration = 0; iteration < 20; iteration += 1) {
    const sums = centers.map((center) => new Array<number>(center.length).fill(0));
    const counts = centers.map(() => 0);
    points.forEach((point, index) => {
      let bestCluster = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      centers.forEach((center, cluster) => {
        const distance = point.reduce(
          (sum, value, feature) => sum + (value - center[feature]) ** 2,
          0,
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCluster = cluster;
        }
      });
      assignments[index] = bestCluster;
      counts[bestCluster] += 1;
      point.forEach((value, feature) => {
        sums[bestCluster][feature] += value;
      });
    });
    centers.forEach((_, cluster) => {
      if (counts[cluster] > 0) {
        centers[cluster] = sums[cluster].map((sum) => sum / counts[cluster]);
      }
    });
  }

  const buckets = centers.map(() => [] as EntityProfile[]);
  included.forEach((profile, index) => buckets[assignments[index]].push(profile));
  const summaries = buckets.map((bucket, id) => {
    const totals = bucket.reduce(
      (summary, profile) => {
        summary.departures += profile.departures;
        summary.passengers += profile.passengers;
        summary.seats += profile.seats;
        summary.delayMinutes += profile.delayMinutes;
        summary.delayedFlights += profile.delayedFlights;
        summary.cancelledFlights += profile.cancelledFlights;
        return summary;
      },
      {
        departures: 0,
        passengers: 0,
        seats: 0,
        delayMinutes: 0,
        delayedFlights: 0,
        cancelledFlights: 0,
      },
    );
    return {
      id,
      count: bucket.length,
      departures: totals.departures,
      averageDelay: averageDelayFor(totals.delayMinutes, totals.delayedFlights),
      delayRate: totals.departures > 0
        ? (totals.delayedFlights / totals.departures) * 100
        : 0,
      loadFactor: totals.seats > 0 ? (totals.passengers / totals.seats) * 100 : 0,
      cancellationRate: totals.departures + totals.cancelledFlights > 0
        ? (totals.cancelledFlights / (totals.departures + totals.cancelledFlights)) * 100
        : 0,
    };
  });
  const averageTraffic = summaries.reduce((sum, cluster) => sum + cluster.departures, 0) /
    Math.max(1, summaries.length);
  const averageDelay = summaries.reduce((sum, cluster) => sum + cluster.averageDelay, 0) /
    Math.max(1, summaries.length);
  const clusters = summaries.map((summary): ClusterSummary => {
    const busy = summary.departures >= averageTraffic;
    const delayed = summary.averageDelay >= averageDelay;
    const label = busy && delayed
      ? 'Trafik tinggi · delay tinggi'
      : busy
        ? 'Trafik tinggi · delay lebih terkendali'
        : delayed
          ? 'Prioritas perbaikan delay'
          : 'Trafik dan delay relatif rendah';
    return { ...summary, label };
  });

  return {
    entities: included.map((profile, index) => ({
      ...profile,
      cluster: assignments[index],
    })),
    clusters,
  };
};

const buildModelFeatures = (row: RawFlightRow): number[] => {
  const departures = numberValue(row.DEPARTURES_PERFORMED);
  const seats = numberValue(row.SEATS);
  const passengers = numberValue(row.PASSENGERS);
  const cancelled = numberValue(row.CANCELLED_FLIGHTS);
  const scheduled = numberValue(row.SCHEDULED_FLIGHTS) || departures + cancelled;
  const month = numberValue(row.MONTH);
  return [
    Math.log1p(Math.max(0, departures)),
    seats > 0 ? passengers / seats : 0,
    scheduled > 0 ? cancelled / scheduled : 0,
    numberValue(row.DISTANCE) / 1000,
    Math.sin((2 * Math.PI * month) / 12),
    Math.cos((2 * Math.PI * month) / 12),
  ];
};

const solveLinearSystem = (matrix: number[][], vector: number[]): number[] | null => {
  const size = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    if (Math.abs(augmented[pivot][column]) < 1e-12) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    for (let entry = column; entry <= size; entry += 1) {
      augmented[column][entry] /= divisor;
    }
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let entry = column; entry <= size; entry += 1) {
        augmented[row][entry] -= factor * augmented[column][entry];
      }
    }
  }
  return augmented.map((row) => row[size]);
};

const calculateDelayModel = (rows: RawFlightRow[]): DelayModelResult | null => {
  const training = rows.filter(
    (row) => Number(row.YEAR) < 2025 ||
      (Number(row.YEAR) === 2025 && Number(row.MONTH) <= 9),
  );
  const testing = rows.filter(
    (row) => Number(row.YEAR) === 2025 && Number(row.MONTH) >= 10,
  );
  if (training.length < 20 || testing.length < 10) return null;

  const featureCount = 6;
  const featureSums = new Array<number>(featureCount).fill(0);
  const featureSquares = new Array<number>(featureCount).fill(0);
  const trainingTargets: number[] = [];
  training.forEach((row) => {
    const features = buildModelFeatures(row);
    features.forEach((value, index) => {
      featureSums[index] += value;
      featureSquares[index] += value * value;
    });
    const delayedFlights = numberValue(row.ARR_DELAY_FLIGHTS);
    trainingTargets.push(averageDelayFor(numberValue(row.TOTAL_ARR_DELAY_MINUTES), delayedFlights));
  });
  const means = featureSums.map((sum) => sum / training.length);
  const deviations = means.map((mean, index) =>
    Math.sqrt(Math.max(0, featureSquares[index] / training.length - mean ** 2)) || 1,
  );
  const dimensions = featureCount + 1;
  const matrix = Array.from({ length: dimensions }, () => new Array<number>(dimensions).fill(0));
  const vector = new Array<number>(dimensions).fill(0);

  training.forEach((row, index) => {
    const features = [
      1,
      ...buildModelFeatures(row).map((value, feature) =>
        (value - means[feature]) / deviations[feature],
      ),
    ];
    const target = Math.log1p(trainingTargets[index]);
    for (let i = 0; i < dimensions; i += 1) {
      vector[i] += features[i] * target;
      for (let j = 0; j < dimensions; j += 1) {
        matrix[i][j] += features[i] * features[j];
      }
    }
  });
  for (let index = 1; index < dimensions; index += 1) matrix[index][index] += 1;
  const coefficients = solveLinearSystem(matrix, vector);
  if (!coefficients) return null;

  const sortedTargets = [...trainingTargets].sort((a, b) => a - b);
  const baseline = sortedTargets[Math.floor(sortedTargets.length / 2)];
  const cap = sortedTargets[Math.floor((sortedTargets.length - 1) * 0.99)];
  let absoluteError = 0;
  let baselineError = 0;
  let targetSum = 0;
  const actual: number[] = [];
  const predictions: number[] = [];
  testing.forEach((row) => {
    const features = [
      1,
      ...buildModelFeatures(row).map((value, feature) =>
        (value - means[feature]) / deviations[feature],
      ),
    ];
    const predicted = Math.max(
      0,
      Math.min(cap, Math.expm1(features.reduce((sum, value, index) => sum + value * coefficients[index], 0))),
    );
    const target = averageDelayFor(
      numberValue(row.TOTAL_ARR_DELAY_MINUTES),
      numberValue(row.ARR_DELAY_FLIGHTS),
    );
    actual.push(target);
    predictions.push(predicted);
    absoluteError += Math.abs(target - predicted);
    baselineError += Math.abs(target - baseline);
    targetSum += target;
  });
  const meanTarget = targetSum / actual.length;
  const totalSquaredDeviation = actual.reduce((sum, target) => sum + (target - meanTarget) ** 2, 0);
  const residualSquared = actual.reduce((sum, target, index) => sum + (target - predictions[index]) ** 2, 0);

  return {
    trainingRows: training.length,
    testRows: testing.length,
    testPeriod: 'Oktober–Desember 2025',
    mae: absoluteError / actual.length,
    baselineMae: baselineError / actual.length,
    rSquared: totalSquaredDeviation > 0 ? 1 - residualSquared / totalSquaredDeviation : 0,
    modelName: 'Ridge regression (fitur agregat)',
  };
};

export const analyzeFlights = (filteredRows: RawFlightRow[], allRows: RawFlightRow[]): FlightAnalysis => {
  const airports = aggregateProfiles(filteredRows, (row) => row.ORIGIN);
  const carriers = aggregateProfiles(filteredRows, (row) => row.UNIQUE_CARRIER);
  return {
    trafficDelay: makeCorrelation(
      'Volume bandara dan rata-rata delay',
      'Log10 total keberangkatan (pesawat/tahun)',
      airports,
      (profile) => profile.departures,
    ),
    loadDelay: makeCorrelation(
      'Load factor bandara dan rata-rata delay',
      'Load factor (% penumpang/kursi)',
      airports,
      (profile) => profile.loadFactor,
    ),
    seasonality: calculateSeasonality(filteredRows),
    airportSegments: clusterProfiles(airports),
    carrierSegments: clusterProfiles(carriers),
    delayModel: calculateDelayModel(allRows),
  };
};
