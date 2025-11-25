import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
  try {
    const response = await fetch('https://weather.tsukumijima.net/api/forecast/city/130010', {
      headers: {
        'User-Agent': "Natsu'sWeatherApp/1.0"
      }
    });
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch weather data' }), { status: response.status });
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
