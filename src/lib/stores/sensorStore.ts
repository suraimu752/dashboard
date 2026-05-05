import { writable } from 'svelte/store';
import { parseTimestampToMs, roundDateToMinute } from '$lib/utils/timestamp';

export interface SensorDataNow {
  temp: number;
  humi: number;
  co2: number;
  press: number;
}

export interface HistoryPoint {
  timestamp: string;
  value: number;
}

export interface SensorDataHistory {
  temperatures: HistoryPoint[];
  humidities: HistoryPoint[];
  pressures: HistoryPoint[];
  co2_concentrations: HistoryPoint[];
}

type SensorStoreState = {
	now: SensorDataNow | null;
	history: SensorDataHistory | null;
	loading: boolean;
	error: string | null;
};

const initialState: SensorStoreState = {
	now: null,
	history: null,
	loading: false,
	error: null
};

export const sensorStore = writable<SensorStoreState>(initialState);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function pruneLast24h(points: HistoryPoint[], nowMs = Date.now()): HistoryPoint[] {
    const cutoff = nowMs - ONE_DAY_MS;
    return points.filter((p) => {
        const t = parseTimestampToMs(p.timestamp);
        return Number.isFinite(t) && t >= cutoff;
    });
}

function appendPoint(points: HistoryPoint[], point: HistoryPoint): HistoryPoint[] {
    const next = [...points, point];
    // keep ascending order; array is small (<= 1440 minute points + DB points)
    next.sort((a, b) => parseTimestampToMs(a.timestamp) - parseTimestampToMs(b.timestamp));
    return next;
}

export async function fetchSensorNow() {
    try {
        console.log('Fetching sensor now...');
        const res = await fetch('/api/sensors/now');
        if (res.ok) {
            const data = await res.json();
            console.log('Sensor now data:', data);
            // Round timestamp to the minute to keep time labels/grids stable.
            const nowIso = roundDateToMinute(new Date()).toISOString();
            sensorStore.update((s) => {
                const next = { ...s, now: data };
                // Also densify chart data every minute using in-memory "now" values,
                // so the graph updates immediately without waiting for history polling.
                if (next.history) {
                    const tPoint: HistoryPoint = { timestamp: nowIso, value: data.temp };
                    const hPoint: HistoryPoint = { timestamp: nowIso, value: data.humi };
                    const pPoint: HistoryPoint = { timestamp: nowIso, value: data.press };
                    const cPoint: HistoryPoint = { timestamp: nowIso, value: data.co2 };

                    next.history = {
                        temperatures: pruneLast24h(appendPoint(next.history.temperatures ?? [], tPoint)),
                        humidities: pruneLast24h(appendPoint(next.history.humidities ?? [], hPoint)),
                        pressures: pruneLast24h(appendPoint(next.history.pressures ?? [], pPoint)),
                        co2_concentrations: pruneLast24h(appendPoint(next.history.co2_concentrations ?? [], cPoint))
                    };
                }
                return next;
            });
        } else {
            console.error('Failed to fetch sensor now:', res.status, res.statusText);
        }
    } catch (e) {
        console.error('Fetch now error', e);
    }
}

export async function fetchSensorHistory() {
    try {
        console.log('Fetching sensor history...');
        const res = await fetch('/api/sensors/history');
        if (res.ok) {
            const data = await res.json();
            console.log('Sensor history data:', data);
            sensorStore.update(s => ({ ...s, history: data }));
        } else {
            console.error('Failed to fetch sensor history:', res.status, res.statusText);
        }
    } catch (e) {
        console.error('Fetch history error', e);
    }
}

export function startSensorPolling() {
    fetchSensorNow();
    fetchSensorHistory();
    setInterval(fetchSensorNow, 60000); // Every minute for current data
    setInterval(fetchSensorHistory, 300000); // Every 5 minutes for history
}
