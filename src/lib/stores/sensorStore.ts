import { writable } from 'svelte/store';

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

function createSensorStore() {
  const { subscribe, set, update } = writable<{
    now: SensorDataNow | null;
    history: SensorDataHistory | null;
    loading: boolean;
    error: string | null;
  }>({
    now: null,
    history: null,
    loading: false,
    error: null
  });

  return {
    subscribe,
    fetchNow: async () => {
      try {
        const res = await fetch('/api/sensors/now');
        if (res.ok) {
          const data = await res.json();
          update(s => ({ ...s, now: data }));
        } else {
            console.error('Failed to fetch current sensor data');
        }
      } catch (e) {
        console.error(e);
      }
    },
    fetchHistory: async () => {
      try {
        const res = await fetch('/api/sensors/history');
        if (res.ok) {
          const data = await res.json();
          update(s => ({ ...s, history: data }));
        } else {
             console.error('Failed to fetch historical sensor data');
        }
      } catch (e) {
        console.error(e);
      }
    },
    startPolling: (intervalMs = 60000) => {
        // Initial fetch
        const store = createSensorStore(); // This line is wrong, I am inside the function.
        // I need to call the fetch functions defined above.
        // But I can't access them easily if I return an object.
        // Let's refactor to just return the store and separate functions or attach them.
    }
  };
}

// Refactored store
const initialState = {
    now: null as SensorDataNow | null,
    history: null as SensorDataHistory | null,
    loading: false,
    error: null as string | null
};

export const sensorStore = writable(initialState);

export async function fetchSensorNow() {
    try {
        console.log('Fetching sensor now...');
        const res = await fetch('/api/sensors/now');
        if (res.ok) {
            const data = await res.json();
            console.log('Sensor now data:', data);
            sensorStore.update(s => ({ ...s, now: data }));
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
