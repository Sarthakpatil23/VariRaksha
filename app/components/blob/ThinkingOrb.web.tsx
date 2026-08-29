import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export type OrbState =
  | 'working'
  | 'searching'
  | 'solving'
  | 'listening'
  | 'connecting'
  | 'weaving'
  | 'composing'
  | 'breathing'
  | 'shaping'
  | 'processing'
  | 'speaking'
  | 'idle';

export type OrbSize = 240 | 120 | 64 | 20 | number;
export type OrbTheme = 'auto' | 'dark' | 'light';

export interface ThinkingOrbProps {
  state?: OrbState | string;
  size?: OrbSize;
  color?: string;
  theme?: OrbTheme;
  speed?: number;
  paused?: boolean;
  style?: ViewStyle | any;
  'aria-label'?: string;
}

interface StateColorConfig {
  r: number;
  g: number;
  b: number;
  highlightR: number;
  highlightG: number;
  highlightB: number;
  baseAlpha: number;
  speedMultiplier: number;
  waveFreq: number;
}

const STATE_CONFIGS: Record<string, StateColorConfig> = {
  listening: {
    // Vitthal Cyan/Blue (#38BDF8)
    r: 14,
    g: 140,
    b: 233,
    highlightR: 56,
    highlightG: 189,
    highlightB: 248,
    baseAlpha: 0.35,
    speedMultiplier: 1.0,
    waveFreq: 2.1,
  },
  processing: {
    // Divine Saffron/Gold (#FF9933)
    r: 234,
    g: 88,
    b: 12,
    highlightR: 255,
    highlightG: 175,
    highlightB: 51,
    baseAlpha: 0.35,
    speedMultiplier: 1.35,
    waveFreq: 3.2,
  },
  working: {
    r: 234,
    g: 88,
    b: 12,
    highlightR: 255,
    highlightG: 175,
    highlightB: 51,
    baseAlpha: 0.35,
    speedMultiplier: 1.35,
    waveFreq: 3.2,
  },
  solving: {
    r: 234,
    g: 88,
    b: 12,
    highlightR: 255,
    highlightG: 175,
    highlightB: 51,
    baseAlpha: 0.35,
    speedMultiplier: 1.35,
    waveFreq: 3.2,
  },
  speaking: {
    // Tulsi Green (#10B981)
    r: 5,
    g: 150,
    b: 105,
    highlightR: 52,
    highlightG: 211,
    highlightB: 153,
    baseAlpha: 0.35,
    speedMultiplier: 1.15,
    waveFreq: 2.4,
  },
  idle: {
    // Warm Slate Gray (#94A3B8)
    r: 100,
    g: 116,
    b: 139,
    highlightR: 148,
    highlightG: 163,
    highlightB: 184,
    baseAlpha: 0.25,
    speedMultiplier: 0.45,
    waveFreq: 1.2,
  },
};

export const ThinkingOrb: React.FC<ThinkingOrbProps> = ({
  state = 'listening',
  size = 240,
  speed = 1,
  paused = false,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const numericSize = typeof size === 'number' ? size : 240;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.round(numericSize * dpr);
    canvas.height = Math.round(numericSize * dpr);

    let animId = 0;
    const cfg = STATE_CONFIGS[state] || STATE_CONFIGS.listening;

    const makeProj = (tiltX: number, tiltY: number, cx: number, cy: number, radius: number) => {
      const sinY = Math.sin(tiltY), cosY = Math.cos(tiltY);
      const sinX = Math.sin(tiltX), cosX = Math.cos(tiltX);
      return (x: number, y: number, z: number) => {
        const x1 = x * cosX + z * sinX;
        const z1 = -x * sinX + z * cosX;
        const y2 = y * cosY - z1 * sinY;
        const z2 = y * sinY + z1 * cosY;
        return [cx + x1 * radius, cy - y2 * radius, z2];
      };
    };

    const render = () => {
      const t = (performance.now() / 1000) * 4.388 * cfg.speedMultiplier * speed;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, numericSize, numericSize);

      const cx = numericSize / 2;
      const cy = numericSize / 2;
      const radius = (numericSize / 2) * 0.874;
      const proj = makeProj(t * 0.18, 0.38, cx, cy, 1);
      const rings = 18;
      const lonDensity = 48;
      const dots: Array<{ x: number; y: number; z: number; r: number; depth: number; wave: number }> = [];

      for (let p = 0; p <= rings; p++) {
        const lat = -Math.PI / 2 + (p / rings) * Math.PI;
        const cosLat = Math.cos(lat);
        const sinLat = Math.sin(lat);
        const wave = 0.62 * Math.sin(t * cfg.waveFreq - p * 0.52) + 0.38 * Math.sin(t * 1.27 + p * 0.83);
        const ringR = radius * (0.88 + 0.105 * wave);
        const count = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));

        for (let g = 0; g < count; g++) {
          const lon = (g / count) * 2 * Math.PI;
          const [px, py, pz] = proj(cosLat * Math.cos(lon) * ringR, sinLat * ringR, cosLat * Math.sin(lon) * ringR);
          const depth = (pz / radius + 1) / 2;
          const boost = Math.max(0, wave);
          const dotR = ((1.2 + 2.8 * depth) * (1 + 0.35 * boost)) * Math.pow(numericSize / 240, 0.65);
          dots.push({ x: px, y: py, z: pz, r: Math.max(0.6, dotR), depth, wave: boost });
        }
      }

      dots.sort((a, b) => a.z - b.z);

      for (const d of dots) {
        const rVal = Math.min(255, Math.round(cfg.r + (cfg.highlightR - cfg.r) * d.depth + 18 * d.wave));
        const gVal = Math.min(255, Math.round(cfg.g + (cfg.highlightG - cfg.g) * d.depth + 18 * d.wave));
        const bVal = Math.min(255, Math.round(cfg.b + (cfg.highlightB - cfg.b) * d.depth + 10 * d.wave));
        const alpha = Math.min(1, Math.max(cfg.baseAlpha, cfg.baseAlpha + (1 - cfg.baseAlpha) * d.depth + 0.15 * d.wave));

        ctx.fillStyle = `rgba(${rVal},${gVal},${bVal},${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!paused) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [numericSize, speed, paused, state]);

  return (
    <View style={[styles.container, { width: numericSize, height: numericSize }, style]}>
      {/* @ts-ignore */}
      <canvas
        ref={canvasRef}
        style={{
          width: numericSize,
          height: numericSize,
          display: 'block',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
});

export default ThinkingOrb;
