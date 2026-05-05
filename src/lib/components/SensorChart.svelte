<script lang="ts">
  import { onMount } from 'svelte';
  import { format } from 'date-fns';
  import {
    Chart,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    TimeScale,
    Filler,
    LineController,
    type ChartConfiguration
  } from 'chart.js';

  Chart.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    TimeScale,
    Filler,
    LineController
  );

  import { SENSOR_COLORS } from '$lib/constants';

  interface HistoryDataPoint {
    value: number;
    timestamp: string;
  }

  interface SensorHistory {
    temperatures: HistoryDataPoint[];
    humidities: HistoryDataPoint[];
    pressures: HistoryDataPoint[];
    co2_concentrations: HistoryDataPoint[];
  }

  let { type, label, history } = $props<{
    type: 'temp' | 'humi' | 'press' | 'co2';
    label: string;
    history: SensorHistory | null;
  }>();

  let canvas: HTMLCanvasElement;
  let chart = $state<Chart | null>(null);
  let labelTimesMs: number[] = [];
  let boundaryIdxSet = new Set<number>();
  let midnightIdxSet = new Set<number>();
  
  const color = $derived(SENSOR_COLORS[type as keyof typeof SENSOR_COLORS]);

  function parseTimestamp(ts: string): Date {
    // Memory points are ISO (e.g. 2026-05-05T10:01:00.000Z)
    // DB points may be "YYYY-MM-DD HH:mm:ss" (space-separated).
    // Normalize to ISO-like without timezone; JS treats it as local time.
    const normalized = ts.includes('T') ? ts : ts.replace(' ', 'T');
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
  }

  function formatLabel(ts: string) {
    return format(parseTimestamp(ts), 'M/d HH:mm');
  }

  function closestIndexByTime(targetMs: number) {
    if (labelTimesMs.length === 0) return null;

    let lo = 0;
    let hi = labelTimesMs.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (labelTimesMs[mid] < targetMs) lo = mid + 1;
      else hi = mid;
    }

    const i = lo;
    const prev = i > 0 ? i - 1 : i;
    const next = i;
    const prevDist = Math.abs(labelTimesMs[prev] - targetMs);
    const nextDist = Math.abs(labelTimesMs[next] - targetMs);
    return prevDist <= nextDist ? prev : next;
  }

  function computeBoundarySets() {
    boundaryIdxSet = new Set<number>();
    midnightIdxSet = new Set<number>();
    if (labelTimesMs.length === 0) return;

    const startMs = labelTimesMs[0];
    const endMs = labelTimesMs[labelTimesMs.length - 1];

    // Anchor to local midnight at/just before start.
    const startLocal = new Date(startMs);
    const t0 = new Date(startLocal);
    t0.setHours(0, 0, 0, 0);

    // Find first 4h boundary >= start.
    let t = t0.getTime();
    while (t + 4 * 60 * 60 * 1000 <= startMs) t += 4 * 60 * 60 * 1000;
    while (t < startMs) t += 4 * 60 * 60 * 1000;

    for (; t <= endMs; t += 4 * 60 * 60 * 1000) {
      const idx = closestIndexByTime(t);
      if (idx === null) continue;
      boundaryIdxSet.add(idx);
      const d = new Date(t);
      if (d.getHours() === 0) midnightIdxSet.add(idx);
    }
  }

  function getCategoryTickIndex(ctx: unknown): number | null {
    const anyCtx = ctx as { index?: unknown; tick?: { value?: unknown } };
    if (typeof anyCtx.index === 'number') return anyCtx.index;
    const v = anyCtx.tick?.value;
    // For CategoryScale, tick.value is typically the label index (number).
    if (typeof v === 'number') return v;
    return null;
  }

  $effect(() => {
    if (chart && history) {
      console.log('Effect triggered:', label, 'History items:', history.temperatures?.length);
      updateChart();
    }
  });

  $effect(() => {
    if (chart) {
      // Update chart color when type changes
      const dataset = chart.data.datasets[0];
      if (dataset) {
        dataset.backgroundColor = color;
        dataset.borderColor = color;
        if ('pointBorderColor' in dataset) {
          (dataset as { pointBorderColor: string }).pointBorderColor = color;
        }
        if ('pointHoverBackgroundColor' in dataset) {
          (dataset as { pointHoverBackgroundColor: string }).pointHoverBackgroundColor = color;
        }
        chart.update();
      }
    }
  });

  function getData(type: string, history: SensorHistory | null): number[] {
    if (!history) return [];
    switch (type) {
      case 'temp': return history.temperatures.map((d) => d.value);
      case 'humi': return history.humidities.map((d) => d.value);
      case 'press': return history.pressures.map((d) => d.value);
      case 'co2': return history.co2_concentrations.map((d) => d.value);
      default: return [];
    }
  }

  function updateChart() {
    if (!history || !chart) return;
    
    console.log('Updating chart:', label, color, history.temperatures.length);

    // Keep a parallel ms array for tick/grid calculations.
    labelTimesMs = history.temperatures.map((d: HistoryDataPoint) => parseTimestamp(d.timestamp).getTime());
    computeBoundarySets();
    const labels = history.temperatures.map((d: HistoryDataPoint) => formatLabel(d.timestamp));
    const data = getData(type, history);

    chart.data.labels = labels;
    const dataset = chart.data.datasets[0];
    if (dataset) {
      dataset.data = data;
      dataset.backgroundColor = color;
      dataset.borderColor = color;
      if ('pointBorderColor' in dataset) {
        (dataset as { pointBorderColor: string }).pointBorderColor = color;
      }
      if ('pointHoverBackgroundColor' in dataset) {
        (dataset as { pointHoverBackgroundColor: string }).pointHoverBackgroundColor = color;
      }
      if ('fill' in dataset) {
        (dataset as { fill: boolean }).fill = false;
      }
    }
    
    chart.update();
  }

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                fill: false,
                tension: 0.3,
                backgroundColor: color,
                borderColor: color,
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: color,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: 'rgba(220,220,220,1)',
                pointHoverBorderWidth: 2,
                pointRadius: 0,
                pointHitRadius: 10,
                data: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { 
                    mode: 'index', 
                    intersect: false,
                    callbacks: {
                        title: (items) => items[0]?.label ?? ''
                    },
                    titleFont: {
                        size: 16
                    },
                    bodyFont: {
                        size: 14
                    }
                }
            },
            scales: {
                x: { 
                    display: true, 
                    grid: { 
                        display: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxTicksLimit: 6,
                        maxRotation: 0,
                        autoSkip: false,
                        callback: (_value, tickIndex) => {
                          // tickIndex aligns to label index for CategoryScale
                          const idx = tickIndex;
                          if (!labelTimesMs[idx]) return '';
                          if (!boundaryIdxSet.has(idx)) return '';
                          const ms = labelTimesMs[idx];
                          return midnightIdxSet.has(idx)
                            ? `${format(new Date(ms), 'M/d')} 0:00`
                            : format(new Date(ms), 'H:mm');
                        },
                        font: {
                            size: 30
                        }
                    }
                },
                y: { 
                    display: true, 
                    grid: { color: '#334155' },
                    border: { color: '#334155' },
                    ticks: { 
                        color: '#94a3b8',
                        font: {
                            size: 30
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        },
        plugins: [
          {
            id: 'fixed-4h-grid-lines',
            // Draw behind dataset lines
            beforeDatasetsDraw(chart) {
              const xScale = chart.scales.x;
              if (!xScale) return;
              const { ctx, chartArea } = chart;

              ctx.save();
              ctx.beginPath();

              // Draw each boundary line explicitly (more reliable than scriptable grid callbacks).
              const indices = Array.from(boundaryIdxSet.values()).sort((a, b) => a - b);
              for (const idx of indices) {
                const x = xScale.getPixelForTick(idx);
                // Avoid drawing on top of the y-axis border at the very left edge.
                if (x <= chartArea.left + 1) continue;
                const isMidnightLine = midnightIdxSet.has(idx);
                ctx.strokeStyle = isMidnightLine ? '#64748b' : '#334155';
                ctx.lineWidth = isMidnightLine ? 2 : 1;

                // Align to pixel grid for crisp lines
                const xx = Math.round(x) + 0.5;
                ctx.beginPath();
                ctx.moveTo(xx, chartArea.top);
                ctx.lineTo(xx, chartArea.bottom);
                ctx.stroke();
              }

              ctx.restore();
            }
          }
        ]
    };

    chart = new Chart(ctx, config);
    
    return () => {
        chart?.destroy();
        chart = null;
    };
  });
</script>

<div class="card w-full h-full p-2 relative overflow-hidden">
  <div class="relative w-full h-full">
    <canvas bind:this={canvas}></canvas>
  </div>
</div>
