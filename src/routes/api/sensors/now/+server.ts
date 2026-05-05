import type { RequestHandler } from './$types';
import { recordEnvironmentNow } from '$lib/server/environmentMemory';

export const GET: RequestHandler = async ({ fetch }) => {
  try {
    const response = await fetch('http://localhost:1880/api/environment/now');
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), { status: response.status });
    }
    const data = await response.json();
    // Record to in-memory minute-resolution buffer for smoother graphs.
    recordEnvironmentNow(data);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
