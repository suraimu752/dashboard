import type { RequestHandler } from './$types';
import { getEnvironmentMemoryRange, getEnvironmentSamplesSince } from '$lib/server/environmentMemory';

type HistoryPoint = { timestamp: string; value: number };
type SensorDataHistory = {
  temperatures: HistoryPoint[];
  humidities: HistoryPoint[];
  pressures: HistoryPoint[];
  co2_concentrations: HistoryPoint[];
};

function toIso(ms: number) {
  return new Date(ms).toISOString();
}

function mergeSeries(db: HistoryPoint[], mem: { t: number; v?: number }[], memStartMs: number): HistoryPoint[] {
  const merged: HistoryPoint[] = [];

  // Keep DB points that are older than the start of memory coverage.
  for (const p of db ?? []) {
    const t = Date.parse(p.timestamp);
    if (!Number.isFinite(t) || t < memStartMs) merged.push(p);
  }

  // Append memory minute points (always ISO timestamps).
  for (const m of mem) {
    if (typeof m.v === 'number') merged.push({ timestamp: toIso(m.t), value: m.v });
  }

  merged.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  return merged;
}

export const GET: RequestHandler = async ({ fetch }) => {
  try {
    const response = await fetch('http://localhost:1880/api/environment/last24hours');
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), { status: response.status });
    }
    const data: SensorDataHistory = await response.json();

    // If we have minute-resolution samples in memory, use them to densify recent graph segments.
    const memRange = getEnvironmentMemoryRange();
    if (memRange) {
      const mem = getEnvironmentSamplesSince(memRange.startMs);

      const tempsMem = mem.map((s) => ({ t: s.t, v: s.temp }));
      const humisMem = mem.map((s) => ({ t: s.t, v: s.humi }));
      const pressMem = mem.map((s) => ({ t: s.t, v: s.press }));
      const co2Mem = mem.map((s) => ({ t: s.t, v: s.co2 }));

      const memStartMs = memRange.startMs;
      data.temperatures = mergeSeries(data.temperatures, tempsMem, memStartMs);
      data.humidities = mergeSeries(data.humidities, humisMem, memStartMs);
      data.pressures = mergeSeries(data.pressures, pressMem, memStartMs);
      data.co2_concentrations = mergeSeries(data.co2_concentrations, co2Mem, memStartMs);
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching historical sensor data:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
