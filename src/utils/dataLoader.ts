import Papa from 'papaparse';
import type { RawFlightRow, AirportCoord, DynamicKPIs } from '../types/flight';
import { getDelayDurationObservation } from './flightAnalytics';

export const loadAllFlightData = (): Promise<{
  rows: RawFlightRow[];
  coords: Record<string, AirportCoord>;
}> => {
  return Promise.all([
    fetch(`${import.meta.env.BASE_URL}data/airports_coords.csv`)
      .then((res) => (res.ok ? res.text() : ''))
      .catch(() => ''),
    fetch(`${import.meta.env.BASE_URL}data/data_dashboard_final.csv`).then((res) => {
      if (!res.ok) throw new Error('Gagal memuat public/data/data_dashboard_final.csv');
      return res.text();
    }),
  ]).then(([coordsText, flightsText]) => {
    const coordsMap: Record<string, AirportCoord> = {};
    if (coordsText) {
      Papa.parse<Record<string, string>>(coordsText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          results.data.forEach((row) => {
            if (row.IATA && row.Latitude && row.Longitude) {
              const iataCode = String(row.IATA).trim();
              coordsMap[iataCode] = {
                iata: iataCode,
                lat: parseFloat(row.Latitude),
                lng: parseFloat(row.Longitude),
              };
            }
          });
        },
      });
    }

    return new Promise<{ rows: RawFlightRow[]; coords: Record<string, AirportCoord> }>(
      (resolve, reject) => {
        Papa.parse<RawFlightRow>(flightsText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve({ rows: results.data, coords: coordsMap });
          },
          error: (err: Error) => reject(err),
        });
      }
    );
  });
};

export const calculateNationalKPIs = (data: RawFlightRow[]): DynamicKPIs => {
  if (!data || !data.length) {
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

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
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
};