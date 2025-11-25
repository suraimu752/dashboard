<script lang="ts">
  import type { ComponentType } from 'svelte';
  
  let { title, value, unit, icon: Icon, color, onClick } = $props<{
    title: string;
    value: number | string;
    unit: string;
    icon: ComponentType;
    color: string;
    onClick?: () => void;
  }>();
</script>

<div 
  class="card flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[80px]" 
  style="display: flex; align-items: center; justify-content: center; cursor: pointer;"
  onclick={onClick}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }}
  role="button"
  tabindex="0"
>
  <div class="flex flex-col items-center justify-center gap-1 z-10">
    <div class="flex items-center gap-1 z-10">
      <Icon size={40} {color} />
      <span class="text-secondary font-bold uppercase tracking-wider" style="font-size: 2.5rem;">{title}</span>
    </div>
    
    <div class="flex items-baseline gap-1 z-10">
      <span class="font-bold text-primary" style="font-size: 5.5rem; color: {color}">{value}</span>
      <span class="text-secondary font-medium" style="font-size: 2.5rem;">{unit}</span>
    </div>
  </div>
</div>
