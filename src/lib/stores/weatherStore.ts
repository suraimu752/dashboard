import { writable } from 'svelte/store';

export interface WeatherForecast {
  dateLabel: string;
  telop: string;
  date: string;
  temperature: {
    min: { celsius: string | null; fahrenheit: string | null };
    max: { celsius: string | null; fahrenheit: string | null };
  };
  image: {
    title: string;
    url: string;
    width: number;
    height: number;
  };
  chanceOfRain: {
    T00_06: string;
    T06_12: string;
    T12_18: string;
    T18_24: string;
  };
}

export interface WeatherData {
  publicTime: string;
  publicTimeFormatted: string;
  publishingOffice: string;
  title: string;
  link: string;
  description: {
    publicTime: string;
    publicTimeFormatted: string;
    headlineText: string;
    bodyText: string;
    text: string;
  };
  forecasts: WeatherForecast[];
}

export const weatherStore = writable<{
    data: WeatherData | null;
    loading: boolean;
    error: string | null;
}>({
    data: null,
    loading: false,
    error: null
});

export async function fetchWeather() {
    try {
        const res = await fetch('/api/weather');
        if (res.ok) {
            const data = await res.json();
            weatherStore.update(s => ({ ...s, data }));
        }
    } catch (e) {
        console.error('Fetch weather error', e);
    }
}

export function startWeatherPolling() {
    fetchWeather();
    setInterval(fetchWeather, 3600000); // Every hour
}
