import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

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

/**
 * Universal Native ThinkingOrb component for iOS & Android.
 * Renders the real-time dynamic state-reactive dotted thought-orb waveform animation
 * inside a hardware-accelerated transparent WebView.
 */
export const ThinkingOrb: React.FC<ThinkingOrbProps> = ({
  state = 'listening',
  size = 240,
  speed = 1,
  style,
}) => {
  const numericSize = typeof size === 'number' ? size : 240;
  const cfg = STATE_CONFIGS[state] || STATE_CONFIGS.listening;

  const nativeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent !important;
      background-color: transparent !important;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    canvas {
      display: block;
      width: ${numericSize}px;
      height: ${numericSize}px;
      background: transparent !important;
    }
  </style>
</head>
<body>
  <canvas id="orb" width="${numericSize * 2}" height="${numericSize * 2}"></canvas>
  <script>
    (function() {
      var canvas = document.getElementById('orb');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var size = ${numericSize};
      var dpr = 2;
      var speed = ${speed};
      var cfg = ${JSON.stringify(cfg)};

      function makeProj(tiltX, tiltY, cx, cy, radius) {
        var sinY = Math.sin(tiltY), cosY = Math.cos(tiltY);
        var sinX = Math.sin(tiltX), cosX = Math.cos(tiltX);
        return function(x, y, z) {
          var x1 = x * cosX + z * sinX;
          var z1 = -x * sinX + z * cosX;
          var y2 = y * cosY - z1 * sinY;
          var z2 = y * sinY + z1 * cosY;
          return [cx + x1 * radius, cy - y2 * radius, z2];
        };
      }

      function draw() {
        var t = (performance.now() / 1000) * 4.388 * cfg.speedMultiplier * speed;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);

        var cx = size / 2;
        var cy = size / 2;
        var radius = (size / 2) * 0.874;
        var proj = makeProj(t * 0.18, 0.38, cx, cy, 1);
        var rings = 18;
        var lonDensity = 48;
        var dots = [];

        for (var p = 0; p <= rings; p++) {
          var lat = -Math.PI / 2 + (p / rings) * Math.PI;
          var cosLat = Math.cos(lat);
          var sinLat = Math.sin(lat);
          var wave = 0.62 * Math.sin(t * cfg.waveFreq - p * 0.52) + 0.38 * Math.sin(t * 1.27 + p * 0.83);
          var ringR = radius * (0.88 + 0.105 * wave);
          var count = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));

          for (var g = 0; g < count; g++) {
            var lon = (g / count) * 2 * Math.PI;
            var pt = proj(cosLat * Math.cos(lon) * ringR, sinLat * ringR, cosLat * Math.sin(lon) * ringR);
            var px = pt[0], py = pt[1], pz = pt[2];
            var depth = (pz / radius + 1) / 2;
            var boost = Math.max(0, wave);
            var dotR = ((1.2 + 2.8 * depth) * (1 + 0.35 * boost)) * Math.pow(size / 240, 0.65);
            dots.push({ x: px, y: py, z: pz, r: Math.max(0.6, dotR), depth: depth, wave: boost });
          }
        }

        dots.sort(function(a, b) { return a.z - b.z; });

        for (var i = 0; i < dots.length; i++) {
          var d = dots[i];
          var rVal = Math.min(255, Math.round(cfg.r + (cfg.highlightR - cfg.r) * d.depth + 18 * d.wave));
          var gVal = Math.min(255, Math.round(cfg.g + (cfg.highlightG - cfg.g) * d.depth + 18 * d.wave));
          var bVal = Math.min(255, Math.round(cfg.b + (cfg.highlightB - cfg.b) * d.depth + 10 * d.wave));
          var alpha = Math.min(1, Math.max(cfg.baseAlpha, cfg.baseAlpha + (1 - cfg.baseAlpha) * d.depth + 0.15 * d.wave));

          ctx.fillStyle = 'rgba(' + rVal + ',' + gVal + ',' + bVal + ',' + alpha + ')';
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }

        requestAnimationFrame(draw);
      }

      draw();
    })();
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, { width: numericSize, height: numericSize }, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: nativeHtml }}
        style={{
          width: numericSize,
          height: numericSize,
          backgroundColor: 'transparent',
        }}
        containerStyle={{
          backgroundColor: 'transparent',
          width: numericSize,
          height: numericSize,
        }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scalesPageToFit={false}
        pointerEvents="none"
        androidHardwareAccelerationDisabled={false}
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
