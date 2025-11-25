<script lang="ts">
  import { onMount } from 'svelte';
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
  
  const color = $derived(SENSOR_COLORS[type as keyof typeof SENSOR_COLORS]);

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

    const labels = history.temperatures.map((d: HistoryDataPoint) => {
        // Format: "YYYY-MM-DD HH:mm:ss" -> "MM/DD HH:mm"
        return d.timestamp.substring(5, 16).replace('-', '/');
    });
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
                        display: true,
                        color: '#334155'
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxTicksLimit: 6,
                        maxRotation: 0,
                        font: {
                            size: 30
                        }
                    }
                },
                y: { 
                    display: true, 
                    grid: { color: '#334155' },
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
        }
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
