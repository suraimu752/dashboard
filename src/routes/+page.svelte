<script lang="ts">
  import { onMount } from 'svelte';
  import { sensorStore, startSensorPolling } from '$lib/stores/sensorStore';
  import { weatherStore, startWeatherPolling } from '$lib/stores/weatherStore';
  
  import Clock from '$lib/components/Clock.svelte';
  import SensorCard from '$lib/components/SensorCard.svelte';
  import SensorChart from '$lib/components/SensorChart.svelte';
  import WeatherForecast from '$lib/components/WeatherForecast.svelte';
  
  import { Thermometer, Droplets, Gauge, Wind, Maximize, Minimize } from 'lucide-svelte';

  type SensorType = 'temp' | 'humi' | 'press' | 'co2';
  
  // Fullscreen API type extensions for vendor prefixes
  interface DocumentWithFullscreen extends Document {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  }
  
  interface HTMLElementWithFullscreen extends HTMLElement {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }

  // Screen Wake Lock API type
  type NavigatorWithWakeLock = Navigator & {
    wakeLock?: {
      request(type?: 'screen'): Promise<WakeLockSentinel>;
    };
  };

  interface WakeLockSentinel {
    released: boolean;
    type: 'screen';
    release(): Promise<void>;
    addEventListener(type: 'release', listener: () => void): void;
    removeEventListener(type: 'release', listener: () => void): void;
  }
  
  let selectedSensor: SensorType = $state('temp');
  let isFullscreen = $state(false);
  let containerElement: HTMLDivElement;
  let fullscreenScale = $state(1);
  let wakeLock: WakeLockSentinel | null = $state(null);

  const CONTENT_WIDTH = 2160;
  const CONTENT_HEIGHT = 1080;
  const BASE_FONT_SIZE = 16; // Base font size in pixels for 2160px width

  function updateRootFontSize() {
    if (!containerElement) return;
    
    const containerWidth = containerElement.offsetWidth;
    const containerHeight = containerElement.offsetHeight;
    
    // Use width as base for font size calculation
    const widthRatio = containerWidth / CONTENT_WIDTH;
    const heightRatio = containerHeight / CONTENT_HEIGHT;
    const ratio = Math.min(widthRatio, heightRatio);
    
    // Set root font size based on container size
    const rootFontSize = BASE_FONT_SIZE * ratio;
    document.documentElement.style.fontSize = `${rootFontSize}px`;
  }

  // Screen Wake Lock API functions
  async function requestWakeLock() {
    const nav = navigator as NavigatorWithWakeLock;
    if (!nav.wakeLock) {
      console.warn('Screen Wake Lock API is not supported in this browser.');
      return;
    }

    try {
      wakeLock = await nav.wakeLock.request('screen');
      console.log('Screen wake lock acquired');
      
      // Handle wake lock release (e.g., when user switches tabs)
      wakeLock.addEventListener('release', () => {
        console.log('Screen wake lock released');
        wakeLock = null;
      });
    } catch (error) {
      console.error('Error acquiring wake lock:', error);
      wakeLock = null;
    }
  }

  async function releaseWakeLock() {
    if (wakeLock && !wakeLock.released) {
      try {
        await wakeLock.release();
        wakeLock = null;
        console.log('Screen wake lock released');
      } catch (error) {
        console.error('Error releasing wake lock:', error);
      }
    }
  }

  // Handle visibility change to reacquire wake lock when page becomes visible
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && !wakeLock) {
      requestWakeLock();
    } else if (document.visibilityState === 'hidden' && wakeLock) {
      releaseWakeLock();
    }
  }

  onMount(() => {
    startSensorPolling();
    startWeatherPolling();
    
    // Request wake lock on mount
    requestWakeLock();
    
    // App launch with ?fullscreen=1: apply fullscreen state without Fullscreen API (e.g. Android WebView)
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (params.get('fullscreen') === '1') {
      isFullscreen = true;
      document.documentElement.style.width = '100vw';
      document.documentElement.style.height = '100vh';
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
    }
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Calculate scale for fullscreen to fit content (with small margin so nothing is cut off)
    const FIT_MARGIN = 0.98; // scale down slightly to avoid edge cutoff
    function calculateFullscreenScale() {
      if (!isFullscreen) {
        fullscreenScale = 1;
        return;
      }
      const vv = typeof window !== 'undefined' && window.visualViewport && typeof window.visualViewport.width === 'number'
        ? window.visualViewport
        : null;
      const screenWidth = (vv ? vv.width : window.innerWidth ?? document.documentElement.clientWidth) || CONTENT_WIDTH;
      const screenHeight = (vv ? vv.height : window.innerHeight ?? document.documentElement.clientHeight) || CONTENT_HEIGHT;
      if (screenWidth <= 0 || screenHeight <= 0) {
        fullscreenScale = 1;
        return;
      }
      const scaleX = screenWidth / CONTENT_WIDTH;
      const scaleY = screenHeight / CONTENT_HEIGHT;
      const fitScale = Math.min(scaleX, scaleY) * FIT_MARGIN;
      const calculatedScale = Math.max(0.1, Math.min(1, fitScale));
      fullscreenScale = isNaN(calculatedScale) || calculatedScale <= 0 ? 1 : calculatedScale;
    }

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const doc = document as DocumentWithFullscreen;
      isFullscreen = !!document.fullscreenElement || !!doc.webkitFullscreenElement || !!doc.mozFullScreenElement || !!doc.msFullscreenElement;
      
      if (isFullscreen) {
        // Set initial scale to 1 to ensure content is visible
        fullscreenScale = 1;
        // Remove fixed sizes from html and body in fullscreen (CSS handles most, but inline styles override)
        document.documentElement.style.width = '100vw';
        document.documentElement.style.height = '100vh';
        document.body.style.width = '100vw';
        document.body.style.height = '100vh';
      } else {
        // Restore fixed sizes when exiting fullscreen
        document.documentElement.style.width = '2160px';
        document.documentElement.style.height = '1080px';
        document.body.style.width = '2160px';
        document.body.style.height = '1080px';
        fullscreenScale = 1;
      }
      
      // Wait for fullscreen to be fully applied before calculating scale
      setTimeout(() => {
        calculateFullscreenScale();
        if (containerElement) {
          containerElement.offsetHeight; // Force reflow
        }
      }, 100);
      
      // Additional check for mobile devices
      setTimeout(() => {
        calculateFullscreenScale();
      }, 300);
    };
    
    // Listen for resize in fullscreen
    const handleResize = () => {
      updateRootFontSize();
      if (isFullscreen) {
        calculateFullscreenScale();
      }
    };
    
    // Initial font size update
    updateRootFontSize();
    
    // If we started with fullscreen=1, run scale calculation after layout (WebView may report size late)
    let resizeObs: ResizeObserver | null = null;
    if (params.get('fullscreen') === '1') {
      [100, 300, 500, 800, 1200].forEach((ms) => setTimeout(calculateFullscreenScale, ms));
      resizeObs = new ResizeObserver(() => calculateFullscreenScale());
      resizeObs.observe(document.documentElement);
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.addEventListener('resize', calculateFullscreenScale);
        window.visualViewport.addEventListener('scroll', calculateFullscreenScale);
      }
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);
    
    return () => {
      resizeObs?.disconnect();
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', calculateFullscreenScale);
        window.visualViewport.removeEventListener('scroll', calculateFullscreenScale);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  });

  const now = $derived($sensorStore.now);
  
  const sensorLabels: Record<SensorType, string> = {
    temp: 'Temperature',
    humi: 'Humidity',
    press: 'Pressure',
    co2: 'CO2'
  };

  const containerStyle = $derived.by(() => {
    const baseStyle = 'width: 2160px; height: 1080px;';
    if (isFullscreen) {
      const scale = fullscreenScale > 0 ? fullscreenScale : 1;
      return `${baseStyle} transform: translate(-50%, -50%) scale(${scale}) !important; transform-origin: center center !important; position: absolute !important; top: 50% !important; left: 50% !important; z-index: 9999 !important; display: flex !important;`;
    }
    return baseStyle;
  });

  // Watch container element and update font size when it changes
  $effect(() => {
    if (containerElement) {
      updateRootFontSize();
      
      const resizeObserver = new ResizeObserver(() => {
        updateRootFontSize();
      });
      resizeObserver.observe(containerElement);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  });

  async function toggleFullscreen() {
    const doc = document.documentElement as HTMLElementWithFullscreen;
    const documentWithFullscreen = document as DocumentWithFullscreen;
    const inRealFullscreen = !!document.fullscreenElement || !!doc.webkitFullscreenElement || !!doc.mozFullScreenElement || !!doc.msFullscreenElement;
    const embeddedFullscreen = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('fullscreen') === '1';

    // When launched with ?fullscreen=1 (e.g. Android app), toggle local state and styles
    if (embeddedFullscreen && !inRealFullscreen) {
      isFullscreen = !isFullscreen;
      if (isFullscreen) {
        document.documentElement.style.width = '100vw';
        document.documentElement.style.height = '100vh';
        document.body.style.width = '100vw';
        document.body.style.height = '100vh';
        setTimeout(() => {
          if (containerElement && typeof window !== 'undefined') {
            const vv = window.visualViewport;
            const screenWidth = vv?.width ?? window.innerWidth ?? document.documentElement.clientWidth ?? CONTENT_WIDTH;
            const screenHeight = vv?.height ?? window.innerHeight ?? document.documentElement.clientHeight ?? CONTENT_HEIGHT;
            const scaleX = screenWidth / CONTENT_WIDTH;
            const scaleY = screenHeight / CONTENT_HEIGHT;
            const fitScale = Math.min(scaleX, scaleY) * 0.98;
            fullscreenScale = Math.max(0.1, Math.min(1, fitScale));
          }
        }, 50);
      } else {
        document.documentElement.style.width = '2160px';
        document.documentElement.style.height = '1080px';
        document.body.style.width = '2160px';
        document.body.style.height = '1080px';
        fullscreenScale = 1;
      }
      return;
    }

    try {
      if (!inRealFullscreen) {
        if (doc.requestFullscreen) {
          await doc.requestFullscreen();
        } else if (doc.webkitRequestFullscreen) {
          await doc.webkitRequestFullscreen();
        } else if (doc.mozRequestFullScreen) {
          await doc.mozRequestFullScreen();
        } else if (doc.msRequestFullscreen) {
          await doc.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (documentWithFullscreen.webkitExitFullscreen) {
          await documentWithFullscreen.webkitExitFullscreen();
        } else if (documentWithFullscreen.mozCancelFullScreen) {
          await documentWithFullscreen.mozCancelFullScreen();
        } else if (documentWithFullscreen.msExitFullscreen) {
          await documentWithFullscreen.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }
</script>


  <div 
    bind:this={containerElement}
    class="bg-slate-900 text-slate-50 font-sans overflow-hidden p-2 flex gap-2 relative" 
    style={containerStyle}
  >
    
    <!-- Left Section: Clock & Sensor Cards (4/10 = 40%) -->
    <div class="flex flex-col gap-2" style="width: 40%;">
      <!-- Clock (4/10 = 40%) -->
      <div class="card p-3" style="height: 40%;">
        <Clock />
      </div>
      
      <!-- Sensor Cards: 2x2 Grid (6/10 = 60%) -->
      <div class="grid grid-cols-2 gap-2" style="height: 60%; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr);">
        <div class="h-full">
          <SensorCard 
            title="Temperature" 
            value={now?.temp?.toFixed(1) ?? '--'} 
            unit="°C" 
            icon={Thermometer} 
            color="var(--color-temp)"
            onClick={() => selectedSensor = 'temp'}
          />
        </div>
        <div class="h-full">
          <SensorCard 
            title="Humidity" 
            value={now?.humi?.toFixed(1) ?? '--'} 
            unit="%" 
            icon={Droplets} 
            color="var(--color-humi)"
            onClick={() => selectedSensor = 'humi'}
          />
        </div>
        <div class="h-full">
          <SensorCard 
            title="Pressure" 
            value={now?.press?.toFixed(0) ?? '--'} 
            unit="hPa" 
            icon={Gauge} 
            color="var(--color-press)"
            onClick={() => selectedSensor = 'press'}
          />
        </div>
        <div class="h-full">
          <SensorCard 
            title="CO2" 
            value={now?.co2?.toFixed(0) ?? '--'} 
            unit="ppm" 
            icon={Wind} 
            color="var(--color-co2)"
            onClick={() => selectedSensor = 'co2'}
          />
        </div>
      </div>
    </div>

    <!-- Right Section: Weather Forecast & Charts (6/10 = 60%) -->
    <div class="flex flex-col gap-2" style="width: 60%;">
      <!-- Weather Forecast -->
      <div style="height: 30%;">
        <WeatherForecast />
      </div>
      
      <!-- Chart: Single chart showing selected sensor -->
      <div class="h-full w-full min-h-0" style="height: 70%;">
        <SensorChart type={selectedSensor} label={sensorLabels[selectedSensor]} history={$sensorStore.history} />
      </div>
    </div>

    <!-- Fullscreen Toggle Button -->
    <button
      onclick={toggleFullscreen}
      style="position: fixed; bottom: 1rem; right: 1rem; z-index: 1000; background-color: rgba(30, 41, 59, 0.3); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-lg); transition: transform 0.2s, box-shadow 0.2s;"
      onmouseenter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onmouseleave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {#if isFullscreen}
        <Minimize size={48} color="var(--color-text-primary)" />
      {:else}
        <Maximize size={48} color="var(--color-text-primary)" />
      {/if}
    </button>

  </div>
