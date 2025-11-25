<script lang="ts">
  import { onMount } from 'svelte';
  import { format } from 'date-fns';

  let now = $state(new Date());

  onMount(() => {
    const interval = setInterval(() => {
      now = new Date();
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<div class="relative h-full w-full flex items-center justify-center">
  <div class="absolute text-secondary font-bold z-10" style="top: 10px; left: 20px; font-size: 3rem;">
    {format(now, 'MM/d EEE.')}
  </div>
  <div class="font-bold tracking-wider text-primary" style="font-size: 10rem; color: var(--color-text-primary); font-variant-numeric: tabular-nums;">
    {format(now, 'HH:mm:ss')}
  </div>
</div>

<style>
  .text-primary {
    color: var(--color-text-primary);
    font-variant-numeric: tabular-nums;
  }
</style>
