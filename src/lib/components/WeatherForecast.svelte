<script lang="ts">
  import { weatherStore } from '$lib/stores/weatherStore';
  import { Loader2 } from 'lucide-svelte';
  import { format } from 'date-fns';

  // Helper to get icon based on telop (simplified mapping or just use image from API)
  // The API provides an image URL (SVG/PNG). We can use that.
</script>

<div class="h-full flex items-center justify-center w-full">
  {#if $weatherStore.data}
    <div class="flex flex-row h-full items-center justify-center w-full gap-2" style="justify-content: space-evenly;">
      {#each $weatherStore.data.forecasts as forecast}
        <div class="card h-full flex flex-col items-center justify-center" style="flex: 1; min-width: 0; max-width: 100%;">
          <span class="font-bold mb-1" style="font-size: 3rem;">{format(new Date(forecast.date), 'M/d')}</span>
          <div class="flex items-center gap-1 mb-1">
            <img src={forecast.image.url} alt={forecast.telop} style="width: 8rem; height: 8rem;" />
            <span class="text-blue-300" style="font-size: 3rem;">
              {Math.max(
                ...Object.values(forecast.chanceOfRain).map(s => parseInt(s.replace('%', '')) || 0)
              )}%
            </span>
          </div>

          <div class="flex gap-4">
            <span class="font-bold" style="color: var(--color-temp); font-size: 3rem;">{forecast.temperature.max.celsius ?? '-'}°C</span>
            <span class="font-bold" style="color: var(--color-humi); font-size: 3rem;">{forecast.temperature.min.celsius ?? '-'}°C</span>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex flex-col h-full justify-between">
      <div class="flex items-center justify-center h-32">
        <Loader2 class="animate-spin text-secondary" />
      </div>
    </div>
  {/if}
</div>
