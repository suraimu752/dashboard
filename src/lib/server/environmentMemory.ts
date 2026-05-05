export type EnvironmentNow = {
  temp?: number;
  humi?: number;
  press?: number;
  co2?: number;
};

type MinuteSample = {
  t: number; // epoch ms
  temp?: number;
  humi?: number;
  press?: number;
  co2?: number;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Module-scoped memory: survives while Node process stays up.
let samples: MinuteSample[] = [];

function prune(nowMs: number) {
  const cutoff = nowMs - ONE_DAY_MS;
  if (samples.length === 0) return;

  // Keep only last 24h, and keep it in ascending time order.
  let firstKeepIdx = 0;
  while (firstKeepIdx < samples.length && samples[firstKeepIdx].t < cutoff) firstKeepIdx++;
  if (firstKeepIdx > 0) samples = samples.slice(firstKeepIdx);
}

export function recordEnvironmentNow(data: EnvironmentNow, nowMs = Date.now()) {
  const sample: MinuteSample = {
    t: nowMs,
    temp: typeof data.temp === 'number' ? data.temp : undefined,
    humi: typeof data.humi === 'number' ? data.humi : undefined,
    press: typeof data.press === 'number' ? data.press : undefined,
    co2: typeof data.co2 === 'number' ? data.co2 : undefined
  };

  // Enforce monotonic order (normally true). If clock jumps backwards, insert then sort.
  if (samples.length === 0 || sample.t >= samples[samples.length - 1].t) {
    samples.push(sample);
  } else {
    samples.push(sample);
    samples.sort((a, b) => a.t - b.t);
  }

  prune(nowMs);
}

export function getEnvironmentSamplesSince(sinceMs: number) {
  prune(Date.now());
  if (samples.length === 0) return [];

  // Linear scan is fine at <= 1440 samples; keeps implementation simple.
  const out: MinuteSample[] = [];
  for (const s of samples) {
    if (s.t >= sinceMs) out.push(s);
  }
  return out;
}

export function getEnvironmentMemoryRange() {
  prune(Date.now());
  if (samples.length === 0) return null;
  return { startMs: samples[0].t, endMs: samples[samples.length - 1].t };
}

