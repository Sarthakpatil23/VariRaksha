import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Vibration,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import {
  MapPoint,
  WARI_FULL_PALKHI_ROUTE,
  WARI_ACTIVE_SEGMENT,
  CURRENT_PILGRIM_LOCATION,
  MAP_SERVICE_POINTS,
} from './mapData';
import { colors, spacing, typography } from '../../constants';
import { AlertStatus } from '../../services/alertService';

export type MapCategoryFilter =
  | 'all'
  | 'medical'
  | 'water'
  | 'food'
  | 'volunteer'
  | 'rest'
  | 'toilet'
  | 'religious';

export interface ActiveSOSMapData {
  id: string;
  lat: number;
  lng: number;
  pilgrimName: string;
  problemType: string;
  status: AlertStatus | 'arrived';
  responderName?: string;
  responderPhone?: string;
  claimedAt?: string;
}

export interface ClaimedRouteMapData {
  volunteerLat: number;
  volunteerLng: number;
  sosLat: number;
  sosLng: number;
  claimedAt?: string; // Common database start timestamp for 100% synchronized multi-device simulation
  durationMs?: number; // Total duration of the road journey (default: 35000ms)
  pilgrimName?: string;
  problemType?: string;
  distance?: string;
  eta?: string;
}

interface VarkariInteractiveMapProps {
  isFullScreen?: boolean;
  onClose?: () => void;
  onExpand?: () => void;
  initialSelectedId?: string | null;
  activeSOS?: ActiveSOSMapData | null;
  claimedRoute?: ClaimedRouteMapData | null;
  onCallVolunteer?: (phone: string) => void;
  onResolveSOS?: () => void;
  onVolunteerArrived?: () => void;
  onEscalateMedical?: () => void;
}

export const VarkariInteractiveMap: React.FC<VarkariInteractiveMapProps> = ({
  isFullScreen = false,
  onClose,
  onExpand,
  initialSelectedId = null,
  activeSOS = null,
  claimedRoute = null,
  onCallVolunteer,
  onResolveSOS,
  onVolunteerArrived,
  onEscalateMedical,
}) => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'mr') as 'mr' | 'hi' | 'en';
  const isMarathi = lang === 'mr';
  const isHindi = lang === 'hi';

  const [selectedCategory, setSelectedCategory] =
    useState<MapCategoryFilter>('all');
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(
    initialSelectedId
      ? MAP_SERVICE_POINTS.find((p) => p.id === initialSelectedId) || null
      : null,
  );

  const [navProgress, setNavProgress] = useState<{
    remainingMeters: number;
    etaText: string;
    progressPercent: number;
    hasArrived: boolean;
  }>({
    remainingMeters: 280,
    etaText: '~1 min walk',
    progressPercent: 0,
    hasArrived: false,
  });

  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getLocalizedName = (point: MapPoint) => {
    if (isMarathi) return point.nameMr;
    if (isHindi) return point.nameHi;
    return point.nameEn;
  };

  const getLocalizedDistance = (point: MapPoint) => {
    if (isMarathi) return point.distanceMr;
    if (isHindi) return point.distanceHi;
    return point.distanceEn;
  };

  const getLocalizedWalkTime = (point: MapPoint) => {
    if (isMarathi) return point.walkTimeMr;
    if (isHindi) return point.walkTimeHi;
    return point.walkTimeEn;
  };

  const getLocalizedStatus = (point: MapPoint) => {
    if (isMarathi) return point.statusMr;
    if (isHindi) return point.statusHi;
    return point.statusEn;
  };

  const getLocalizedDesc = (point: MapPoint) => {
    if (isMarathi) return point.descriptionMr;
    if (isHindi) return point.descriptionHi;
    return point.descriptionEn;
  };

  // Sync category filter to Leaflet map dynamically without reloading HTML
  useEffect(() => {
    sendMapAction('filter_category', { category: selectedCategory });
  }, [selectedCategory]);

  // Web window message listener for iframe
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.type === 'marker_click' && data.id) {
            const point = MAP_SERVICE_POINTS.find((p) => p.id === data.id);
            if (point) setSelectedPoint(point);
          } else if (data && data.type === 'pilgrim_click') {
            showPilgrimAlert();
          } else if (data && data.type === 'sim_progress') {
            setNavProgress({
              remainingMeters: data.remainingMeters,
              etaText: data.etaText,
              progressPercent: data.progressPercent,
              hasArrived: data.hasArrived,
            });
            if (data.hasArrived && onVolunteerArrived) {
              onVolunteerArrived();
            }
          }
        } catch {
          // Ignore
        }
      };

      window.addEventListener('message', handleWebMessage);
      return () => {
        window.removeEventListener('message', handleWebMessage);
      };
    }
  }, [isMarathi, isHindi, onVolunteerArrived]);

  const showPilgrimAlert = () => {
    Vibration.vibrate(15);
    Alert.alert(
      isMarathi
        ? 'माझे सध्याचे स्थान'
        : isHindi
        ? 'मेरा वर्तमान स्थान'
        : 'My Current Location',
      isMarathi
        ? `${CURRENT_PILGRIM_LOCATION.landmarkMr}\n${CURRENT_PILGRIM_LOCATION.distanceToDestMr}`
        : isHindi
        ? `${CURRENT_PILGRIM_LOCATION.landmarkHi}\n${CURRENT_PILGRIM_LOCATION.distanceToDestHi}`
        : `${CURRENT_PILGRIM_LOCATION.landmarkEn}\n${CURRENT_PILGRIM_LOCATION.distanceToDestEn}`,
    );
  };

  // Generate Base Leaflet Map HTML
  const generateLeafletHtml = () => {
    const pointsJson = JSON.stringify(
      MAP_SERVICE_POINTS.map((p) => ({
        id: p.id,
        category: p.category,
        name: getLocalizedName(p),
        distance: getLocalizedDistance(p),
        walkTime: getLocalizedWalkTime(p),
        lat: p.lat,
        lng: p.lng,
        badgeColor: p.badgeColor,
        iconType: p.iconType,
      })),
    );

    const fullRouteJson = JSON.stringify(WARI_FULL_PALKHI_ROUTE);
    const activeRouteJson = JSON.stringify(WARI_ACTIVE_SEGMENT);
    const pilgrimLat = CURRENT_PILGRIM_LOCATION.lat;
    const pilgrimLng = CURRENT_PILGRIM_LOCATION.lng;

    const activeSosJson = JSON.stringify(activeSOS);
    const claimedRouteJson = JSON.stringify(claimedRoute);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #FFF8E7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
    }
    .leaflet-container { background: #FFF8E7; }

    /* Custom Vector Marker Pins */
    .custom-marker-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transform: translate(-50%, -100%);
    }

    .marker-pin {
      width: 36px;
      height: 42px;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
      transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .marker-pin:hover, .marker-pin:active {
      transform: scale(1.22);
    }

    /* Pilgrim Live GPS Pulse Pin */
    .pilgrim-radar-pin {
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    }
    .radar-ring {
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(230, 81, 0, 0.35);
      animation: radarPulse 2s infinite ease-out;
    }
    .radar-ring-delay {
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(230, 81, 0, 0.25);
      animation: radarPulse 2s infinite 0.75s ease-out;
    }
    .pilgrim-core {
      position: relative;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF9933 0%, #E65100 100%);
      border: 3px solid #FFFFFF;
      box-shadow: 0 3px 8px rgba(230,81,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFF;
      font-size: 13px;
      font-weight: 900;
      z-index: 5;
    }
    .pilgrim-label {
      position: absolute;
      top: -18px;
      background: #5D001E;
      color: #FFF;
      font-size: 10px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 8px;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    /* Emergency SOS Beacon Pulse Pin */
    .sos-beacon-pin {
      position: relative;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    }
    .sos-radar-ring {
      position: absolute;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(220, 38, 38, 0.5);
      animation: sosPulse 1.4s infinite ease-out;
    }
    .sos-radar-ring-delay {
      position: absolute;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(220, 38, 38, 0.3);
      animation: sosPulse 1.4s infinite 0.5s ease-out;
    }
    .sos-core {
      position: relative;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #DC2626;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(220, 38, 38, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFF;
      font-size: 15px;
      font-weight: 900;
      z-index: 6;
    }
    .sos-label {
      position: absolute;
      top: -20px;
      background: #DC2626;
      color: #FFF;
      font-size: 11px;
      font-weight: 900;
      padding: 2px 8px;
      border-radius: 10px;
      white-space: nowrap;
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
    }

    /* Moving Volunteer Tactical Road Avatar */
    .volunteer-moving-pin {
      position: relative;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    }
    .vol-pulse-ring {
      position: absolute;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(21, 128, 61, 0.45);
      animation: radarPulse 1.6s infinite ease-out;
    }
    .vol-core {
      position: relative;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #15803D 0%, #16A34A 100%);
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(22, 163, 74, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFF;
      font-size: 14px;
      z-index: 8;
    }
    .vol-status-badge {
      position: absolute;
      top: -24px;
      background: #15803D;
      color: #FFF;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 10px;
      white-space: nowrap;
      box-shadow: 0 2px 5px rgba(0,0,0,0.25);
      transition: background 0.3s;
    }

    @keyframes radarPulse {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.9); opacity: 0; }
    }
    @keyframes sosPulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${pilgrimLat}, ${pilgrimLng}], ${isFullScreen ? 15 : 14});

    // OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Full Palkhi Route
    var fullRouteCoords = ${fullRouteJson};
    L.polyline(fullRouteCoords, {
      color: '#2E7D32',
      weight: 3.5,
      opacity: 0.65,
      dashArray: '5, 8',
      lineCap: 'round'
    }).addTo(map);

    // Active Highway Segment
    var activeRouteCoords = ${activeRouteJson};
    L.polyline(activeRouteCoords, {
      color: '#FFB74D',
      weight: 8,
      opacity: 0.5,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    L.polyline(activeRouteCoords, {
      color: '#E65100',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Vector Pin Helper
    function createVectorPinSvg(color, iconSvg) {
      return '<svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M18 42C18 42 34 25.5 34 16C34 7.16344 26.8366 0 18 0C9.16344 0 2 7.16344 2 16C2 25.5 18 42 18 42Z" fill="' + color + '"/>' +
        '<circle cx="18" cy="16" r="11" fill="#FFFFFF"/>' +
        iconSvg +
        '</svg>';
    }

    function getCategorySvgIcon(type, color) {
      switch(type) {
        case 'medical':
          return '<path d="M18 10V22M12 16H24" stroke="' + color + '" stroke-width="3" stroke-linecap="round"/>';
        case 'water':
          return '<path d="M18 10C18 10 13 15 13 18C13 20.76 15.24 23 18 23C20.76 23 23 20.76 23 18C23 15 18 10 18 10Z" fill="' + color + '"/>';
        case 'food':
          return '<path d="M13 12V22M15 12V22M11 12C11 14.5 13 16 15 16V22M21 12V17C21 18.5 19.5 20 18 20V22" stroke="' + color + '" stroke-width="2" stroke-linecap="round"/>';
        case 'volunteer':
          return '<path d="M15 13C16.66 13 18 11.66 18 10C18 8.34 16.66 7 15 7C13.34 7 12 8.34 12 10C12 11.66 13.34 13 15 13ZM15 15C12.67 15 8 16.17 8 18.5V21H22V18.5C22 16.17 17.33 15 15 15Z" fill="' + color + '"/>';
        case 'rest':
          return '<path d="M11 11H23V18H11V11ZM11 18V21M23 18V21M9 13V21M9 13C8 13 7 13.5 7 14.5V21" stroke="' + color + '" stroke-width="2" stroke-linecap="round"/>';
        case 'toilet':
          return '<path d="M15 9C16.1 9 17 8.1 17 7C17 5.9 16.1 5 15 5C13.9 5 13 5.9 13 7C13 8.1 13.9 9 15 9ZM12 12V16H14V21H16V16H18V12C18 10.9 17.1 10 16 10H14C12.9 10 12 10.9 12 12Z" fill="' + color + '"/>';
        default:
          return '<circle cx="18" cy="16" r="4" fill="' + color + '"/>';
      }
    }

    // Pilgrim Live Location Marker
    var pilgrimHtml = '<div class="pilgrim-radar-pin">' +
      '<div class="radar-ring"></div>' +
      '<div class="radar-ring-delay"></div>' +
      '<div class="pilgrim-label">${isMarathi ? 'मी (You)' : 'You'}</div>' +
      '<div class="pilgrim-core">🚩</div>' +
      '</div>';

    var pilgrimIcon = L.divIcon({
      className: '',
      html: pilgrimHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    var pilgrimMarker = L.marker([${pilgrimLat}, ${pilgrimLng}], { icon: pilgrimIcon }).addTo(map);
    pilgrimMarker.on('click', function() {
      notifyApp({ type: 'pilgrim_click' });
    });

    // Handle Active SOS Beacon Marker
    var activeSosData = ${activeSosJson};
    var sosMarker = null;
    if (activeSosData && activeSosData.lat && activeSosData.lng) {
      var sosHtml = '<div class="sos-beacon-pin">' +
        '<div class="sos-radar-ring"></div>' +
        '<div class="sos-radar-ring-delay"></div>' +
        '<div class="sos-label">🚨 SOS LOCATION</div>' +
        '<div class="sos-core">🚨</div>' +
        '</div>';

      var sosIcon = L.divIcon({
        className: '',
        html: sosHtml,
        iconSize: [56, 56],
        iconAnchor: [28, 28]
      });

      sosMarker = L.marker([activeSosData.lat, activeSosData.lng], { icon: sosIcon, zIndexOffset: 1000 }).addTo(map);
    }

    // ========================================================
    // ULTRA-SMOOTH TIME-SYNCHRONIZED ROAD NAVIGATION SIMULATION
    // ========================================================
    var claimedRouteData = ${claimedRouteJson};
    var liveVolMarker = null;

    // Helper: Haversine distance in meters
    function getHaversineDist(p1, p2) {
      var R = 6371000;
      var dLat = (p2[0] - p1[0]) * Math.PI / 180;
      var dLng = (p2[1] - p1[1]) * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    // Generate smooth realistic road curve path between start and destination
    function generateSmoothRoadWaypoints(start, dest) {
      var dLat = dest[0] - start[0];
      var dLng = dest[1] - start[1];
      return [
        start,
        [start[0] + dLat * 0.20, start[1] + dLng * 0.08],
        [start[0] + dLat * 0.45, start[1] + dLng * 0.32],
        [start[0] + dLat * 0.70, start[1] + dLng * 0.68],
        [start[0] + dLat * 0.88, start[1] + dLng * 0.92],
        dest
      ];
    }

    if (claimedRouteData && claimedRouteData.volunteerLat && claimedRouteData.sosLat) {
      var volStart = [claimedRouteData.volunteerLat, claimedRouteData.volunteerLng];
      var sosTarget = [claimedRouteData.sosLat, claimedRouteData.sosLng];

      var roadWaypoints = generateSmoothRoadWaypoints(volStart, sosTarget);

      // Draw stable static road navigation polyline
      L.polyline(roadWaypoints, {
        color: '#0284C7',
        weight: 7,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      L.polyline(roadWaypoints, {
        color: '#0284C7',
        weight: 4,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Volunteer Live Pin
      var volHtml = '<div class="volunteer-moving-pin" id="vol-pin">' +
        '<div class="vol-pulse-ring"></div>' +
        '<div class="vol-status-badge" id="vol-hud">🏃 280m · ~1 min</div>' +
        '<div class="vol-core">🧑‍🤝‍🧑</div>' +
        '</div>';

      var volDivIcon = L.divIcon({
        className: '',
        html: volHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      liveVolMarker = L.marker(volStart, { icon: volDivIcon, zIndexOffset: 950 }).addTo(map);
      map.fitBounds([volStart, sosTarget], { padding: [60, 60] });

      // Compute Segment Metrics
      var segDists = [];
      var cumDists = [0];
      var totalDist = 0;
      for (var i = 0; i < roadWaypoints.length - 1; i++) {
        var d = getHaversineDist(roadWaypoints[i], roadWaypoints[i+1]);
        segDists.push(d);
        totalDist += d;
        cumDists.push(totalDist);
      }
      if (totalDist === 0) totalDist = 1;

      // TIME-SYNCHRONIZED CALCULATION
      var claimedAtMs = new Date(claimedRouteData.claimedAt || new Date().toISOString()).getTime();
      var durationMs = claimedRouteData.durationMs || 35000; // 35 seconds smooth journey
      var lastBridgeEmit = 0;
      var hasNotifiedArrival = false;

      function renderFrame() {
        var now = Date.now();
        var elapsed = Math.max(0, now - claimedAtMs);
        var progress = Math.min(1.0, elapsed / durationMs);

        // Compute current coordinate along waypoints
        var targetDist = progress * totalDist;
        var curLat = sosTarget[0];
        var curLng = sosTarget[1];

        for (var s = 0; s < cumDists.length - 1; s++) {
          if (targetDist <= cumDists[s+1]) {
            var segLen = segDists[s] || 1;
            var subProgress = (targetDist - cumDists[s]) / segLen;
            var p1 = roadWaypoints[s];
            var p2 = roadWaypoints[s+1];
            curLat = p1[0] + (p2[0] - p1[0]) * subProgress;
            curLng = p1[1] + (p2[1] - p1[1]) * subProgress;
            break;
          }
        }

        if (progress >= 1.0) {
          curLat = sosTarget[0];
          curLng = sosTarget[1];
        }

        // Smooth position update
        if (liveVolMarker) {
          liveVolMarker.setLatLng([curLat, curLng]);
        }

        var isArrived = progress >= 1.0;
        var remainingMeters = Math.max(0, Math.round(totalDist * (1 - progress)));
        var remainingSec = Math.max(0, Math.round((durationMs - elapsed) / 1000));
        var etaText = remainingSec > 25 ? '~1 min walk' : remainingSec > 3 ? ('~' + remainingSec + 's') : 'Arrived!';

        var hudEl = document.getElementById('vol-hud');
        if (hudEl) {
          if (isArrived) {
            hudEl.innerHTML = '🎯 ARRIVED ON SCENE';
            hudEl.style.background = '#059669';
          } else {
            hudEl.innerHTML = '🏃 ' + remainingMeters + 'm · ' + etaText;
            hudEl.style.background = '#15803D';
          }
        }

        // Throttle React Native bridge events to once every 1000ms
        if (now - lastBridgeEmit >= 1000 || isArrived) {
          lastBridgeEmit = now;
          notifyApp({
            type: 'sim_progress',
            remainingMeters: remainingMeters,
            etaText: etaText,
            progressPercent: Math.round(progress * 100),
            hasArrived: isArrived,
          });

          if (isArrived && !hasNotifiedArrival) {
            hasNotifiedArrival = true;
            notifyApp({ type: 'volunteer_arrived' });
          }
        }
      }

      // Smooth 50ms interval animation
      setInterval(renderFrame, 50);
      renderFrame();
    } else if (activeSosData && activeSosData.lat && activeSosData.lng) {
      map.setView([activeSosData.lat, activeSosData.lng], 16, { animate: true });
    }

    // Service Markers Map
    var allPoints = ${pointsJson};
    var markerLayerGroup = L.layerGroup().addTo(map);
    var markerMap = {};

    function renderMarkers(categoryFilter) {
      markerLayerGroup.clearLayers();
      markerMap = {};

      allPoints.forEach(function(p) {
        if (categoryFilter !== 'all' && p.category !== categoryFilter) return;

        var iconSvgContent = getCategorySvgIcon(p.iconType, p.badgeColor);
        var pinSvg = createVectorPinSvg(p.badgeColor, iconSvgContent);
        var customHtml = '<div class="custom-marker-wrapper" id="pin-' + p.id + '">' +
          '<div class="marker-pin">' + pinSvg + '</div>' +
          '</div>';

        var divIcon = L.divIcon({
          className: '',
          html: customHtml,
          iconSize: [36, 42],
          iconAnchor: [18, 42]
        });

        var m = L.marker([p.lat, p.lng], { icon: divIcon });
        m.on('click', function() {
          notifyApp({ type: 'marker_click', id: p.id });
        });

        markerLayerGroup.addLayer(m);
        markerMap[p.id] = m;
      });
    }

    // Initial render
    renderMarkers('all');

    // Notify React Native
    function notifyApp(data) {
      var json = JSON.stringify(data);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(json);
      } else if (window.parent) {
        window.parent.postMessage(json, '*');
      }
    }

    // Listen for events from React Native
    window.addEventListener('message', function(event) {
      try {
        var msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg.action === 'filter_category') {
          renderMarkers(msg.category || 'all');
        } else if (msg.action === 'recenter') {
          if (claimedRouteData) {
            map.fitBounds([[claimedRouteData.volunteerLat, claimedRouteData.volunteerLng], [claimedRouteData.sosLat, claimedRouteData.sosLng]], { padding: [50, 50] });
          } else if (activeSosData) {
            map.setView([activeSosData.lat, activeSosData.lng], 16, { animate: true });
          } else {
            map.setView([${pilgrimLat}, ${pilgrimLng}], 15, { animate: true });
          }
        } else if (msg.action === 'fit_route') {
          map.fitBounds(polyline.getBounds(), { padding: [35, 35] });
        } else if (msg.action === 'zoom_in') {
          map.zoomIn();
        } else if (msg.action === 'zoom_out') {
          map.zoomOut();
        } else if (msg.action === 'focus_marker' && msg.id && markerMap[msg.id]) {
          map.setView(markerMap[msg.id].getLatLng(), 16, { animate: true });
        }
      } catch(e) {}
    });
  </script>
</body>
</html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker_click' && data.id) {
        Vibration.vibrate(20);
        const point = MAP_SERVICE_POINTS.find((p) => p.id === data.id);
        if (point) setSelectedPoint(point);
      } else if (data.type === 'pilgrim_click') {
        showPilgrimAlert();
      } else if (data.type === 'sim_progress') {
        setNavProgress({
          remainingMeters: data.remainingMeters,
          etaText: data.etaText,
          progressPercent: data.progressPercent,
          hasArrived: data.hasArrived,
        });
        if (data.hasArrived && onVolunteerArrived) {
          onVolunteerArrived();
        }
      }
    } catch {
      // Ignore
    }
  };

  const sendMapAction = (action: string, payload?: any) => {
    Vibration.vibrate(15);
    const msg = JSON.stringify({ action, ...payload });
    if (webViewRef.current) {
      webViewRef.current.postMessage(msg);
    } else if (Platform.OS === 'web' && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Vibration.vibrate(30);
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert(
        isMarathi ? 'कॉल करा' : 'Call Contact',
        `${isMarathi ? 'डायल करत आहे:' : 'Dialing:'} ${phone}`,
      );
    });
  };

  const handleDirections = (point: MapPoint) => {
    Vibration.vibrate(20);
    Alert.alert(
      isMarathi ? 'मार्गदर्शन (Directions)' : 'Route Guidance',
      isMarathi
        ? `“${getLocalizedName(point)}” ${getLocalizedDistance(
            point,
          )} अंतरावर आहे (${getLocalizedWalkTime(
            point,
          )}). मुख्य पालखी मार्गाच्या डाव्या बाजूने चालत जा.`
        : `"${getLocalizedName(point)}" is ${getLocalizedDistance(
            point,
          )} away (${getLocalizedWalkTime(
            point,
          )}). Follow the marked route along the left side.`,
    );
  };

  const isEnRoute = Boolean(claimedRoute || (activeSOS && (activeSOS.status === 'in_progress' || activeSOS.status === 'arrived')));

  return (
    <View style={[styles.container, isFullScreen && styles.fullScreenContainer]}>
      {/* Map Header Controls when in Full Screen */}
      {isFullScreen && (
        <View style={styles.fullScreenHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.closeBtn}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitleText}>
              {navProgress.hasArrived
                ? '🎯 VOLUNTEER ON SCENE'
                : isEnRoute
                ? '🚨 LIVE RESPONDER DISPATCH'
                : activeSOS
                ? '🚨 EMERGENCY SOS'
                : isMarathi
                ? 'वारी पालखी मार्ग'
                : isHindi
                ? 'वारी पालकी मार्ग'
                : 'Wari Palkhi Route'}
            </Text>
            <Text style={styles.headerSubtitleText}>
              {navProgress.hasArrived
                ? 'Assistance in progress at pilgrim location'
                : isEnRoute
                ? `Road Navigation · ${navProgress.remainingMeters}m (${navProgress.etaText})`
                : activeSOS
                ? activeSOS.problemType
                : isMarathi
                ? CURRENT_PILGRIM_LOCATION.distanceToDestMr
                : isHindi
                ? CURRENT_PILGRIM_LOCATION.distanceToDestHi
                : CURRENT_PILGRIM_LOCATION.distanceToDestEn}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => sendMapAction('recenter')}
            style={styles.recenterHeaderBtn}
          >
            <Ionicons name="locate" size={18} color={colors.saffronDark} />
          </TouchableOpacity>
        </View>
      )}

      {/* LIVE TACTICAL ROAD NAVIGATION HUD OVERLAY */}
      {isEnRoute && (
        <View style={styles.tacticalHudBanner}>
          <View style={styles.hudTopRow}>
            <View
              style={[
                styles.hudBadgeMoving,
                navProgress.hasArrived && styles.hudBadgeArrived,
              ]}
            >
              <View
                style={[
                  styles.pulseDotGreen,
                  navProgress.hasArrived && { backgroundColor: '#FFFFFF' },
                ]}
              />
              <Text
                style={[
                  styles.hudBadgeText,
                  navProgress.hasArrived && { color: '#FFFFFF' },
                ]}
              >
                {navProgress.hasArrived ? 'VOLUNTEER ARRIVED' : 'MOVING ALONG ROAD'}
              </Text>
            </View>

            <Text style={styles.hudDistanceText}>
              {navProgress.hasArrived
                ? 'At SOS Location'
                : `${navProgress.remainingMeters}m (${navProgress.etaText})`}
            </Text>
          </View>

          {/* Road Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.max(5, navProgress.progressPercent)}%` },
                navProgress.hasArrived && { backgroundColor: '#10B981' },
              ]}
            />
          </View>

          <View style={styles.hudBottomRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hudSubtitle} numberOfLines={1}>
                {navProgress.hasArrived
                  ? 'Volunteer is with the pilgrim on scene'
                  : activeSOS?.responderName
                  ? `Responder: ${activeSOS.responderName}`
                  : claimedRoute?.pilgrimName
                  ? `Navigating to: ${claimedRoute.pilgrimName}`
                  : 'Approaching SOS location along road'}
              </Text>
            </View>

            {activeSOS?.responderPhone && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  onCallVolunteer
                    ? onCallVolunteer(activeSOS.responderPhone!)
                    : handleCall(activeSOS.responderPhone)
                }
                style={styles.hudCallBtn}
              >
                <Ionicons name="call" size={14} color="#FFFFFF" />
                <Text style={styles.hudCallBtnText}>Call</Text>
              </TouchableOpacity>
            )}

            {onEscalateMedical && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onEscalateMedical}
                style={styles.hudEscalateBtn}
              >
                <Ionicons name="medkit" size={14} color="#FFFFFF" />
                <Text style={styles.hudEscalateBtnText}>
                  {isMarathi ? 'वैद्यकीय केंद्र' : 'Medical Camp'}
                </Text>
              </TouchableOpacity>
            )}

            {onResolveSOS && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onResolveSOS}
                style={styles.hudResolveBtn}
              >
                <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
                <Text style={styles.hudResolveBtnText}>
                  {isMarathi ? 'इथेच सोडवा' : 'Resolve'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* SOS ACTIVE BANNER (When waiting for volunteer) */}
      {activeSOS && activeSOS.status === 'nearby' && !isEnRoute && (
        <View style={styles.sosStatusBannerWaiting}>
          <View style={styles.sosBannerLeft}>
            <Ionicons name="warning" size={20} color="#FFFFFF" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.sosBannerTitle}>SOS ACTIVE · BROADCASTING</Text>
              <Text style={styles.sosBannerSubtext}>
                Help request sent · Waiting for nearby responder to claim...
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Category Filter Chips Strip (Available in Full Screen when not in SOS) */}
      {isFullScreen && !activeSOS && !claimedRoute && (
        <View style={styles.filterStripContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedCategory('all')}
              style={[
                styles.filterChip,
                selectedCategory === 'all' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'all' && styles.filterChipTextActive,
                ]}
              >
                {isMarathi ? 'सर्व (All)' : 'All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedCategory('medical')}
              style={[
                styles.filterChip,
                selectedCategory === 'medical' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'medical' && styles.filterChipTextActive,
                ]}
              >
                🩺 {isMarathi ? 'वैद्यकीय' : 'Medical'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedCategory('water')}
              style={[
                styles.filterChip,
                selectedCategory === 'water' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'water' && styles.filterChipTextActive,
                ]}
              >
                💧 {isMarathi ? 'पाणी' : 'Water'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedCategory('food')}
              style={[
                styles.filterChip,
                selectedCategory === 'food' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'food' && styles.filterChipTextActive,
                ]}
              >
                🍛 {isMarathi ? 'महाप्रसाद' : 'Prasad'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedCategory('volunteer')}
              style={[
                styles.filterChip,
                selectedCategory === 'volunteer' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'volunteer' && styles.filterChipTextActive,
                ]}
              >
                🧑‍🤝‍🧑 {isMarathi ? 'मदतनीस' : 'Volunteers'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Map Render Frame */}
      <View
        style={[
          styles.mapFrame,
          isFullScreen ? styles.mapFrameFullScreen : styles.mapFramePreview,
        ]}
      >
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={generateLeafletHtml()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: isFullScreen ? 0 : 16,
              pointerEvents: isFullScreen ? 'auto' : 'none',
            }}
            title="Wari Street Map"
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: generateLeafletHtml() }}
            onMessage={handleMessage}
            style={styles.webView}
            scrollEnabled={isFullScreen}
            nestedScrollEnabled={isFullScreen}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            pointerEvents={isFullScreen ? 'auto' : 'none'}
          />
        )}

        {/* Clickable Overlay on Dashboard Preview to expand into Full Map smoothly */}
        {!isFullScreen && onExpand && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onExpand}
            style={styles.previewClickableOverlay}
          >
            <View style={styles.expandButtonPill}>
              <Ionicons name="expand" size={13} color={colors.surface} />
              <Text style={styles.expandButtonText}>
                {isEnRoute
                  ? `Road Nav (${navProgress.remainingMeters}m)`
                  : isMarathi
                  ? 'नकाशा उघडा'
                  : 'Open Map'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Floating Controls in Full Screen Mode */}
        {isFullScreen && (
          <View style={styles.floatingControls}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => sendMapAction('recenter')}
              style={styles.floatingBtn}
              accessibilityLabel="Recenter Map"
            >
              <Ionicons name="locate" size={20} color={colors.saffronDark} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => sendMapAction('fit_route')}
              style={styles.floatingBtn}
              accessibilityLabel="Fit Route"
            >
              <Ionicons name="git-commit-outline" size={20} color={colors.maroon} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => sendMapAction('zoom_in')}
              style={styles.floatingBtn}
              accessibilityLabel="Zoom In"
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => sendMapAction('zoom_out')}
              style={styles.floatingBtn}
              accessibilityLabel="Zoom Out"
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Selected Marker Detail Card */}
      {isFullScreen && selectedPoint && (
        <View style={styles.infoCardWrapper}>
          <View style={styles.infoCard}>
            <TouchableOpacity
              onPress={() => setSelectedPoint(null)}
              style={styles.cardCloseBtn}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: selectedPoint.badgeColor },
                ]}
              >
                <Ionicons
                  name={
                    selectedPoint.iconType === 'medical'
                      ? 'medkit'
                      : selectedPoint.iconType === 'water'
                      ? 'water'
                      : selectedPoint.iconType === 'food'
                      ? 'restaurant'
                      : selectedPoint.iconType === 'volunteer'
                      ? 'people'
                      : 'flag'
                  }
                  size={20}
                  color={colors.surface}
                />
              </View>

              <View style={styles.cardHeaderCol}>
                <Text style={styles.cardNameText} numberOfLines={2}>
                  {getLocalizedName(selectedPoint)}
                </Text>
                <View style={styles.cardDistanceRow}>
                  <Ionicons name="walk-outline" size={14} color={colors.maroon} />
                  <Text style={styles.cardDistanceText}>
                    {getLocalizedDistance(selectedPoint)} · {getLocalizedWalkTime(selectedPoint)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.cardStatusText}>
              {getLocalizedStatus(selectedPoint)}
            </Text>
            <Text style={styles.cardDescText}>
              {getLocalizedDesc(selectedPoint)}
            </Text>

            <View style={styles.cardActionsRow}>
              {selectedPoint.phone && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleCall(selectedPoint.phone)}
                  style={styles.cardCallBtn}
                >
                  <Ionicons name="call" size={16} color={colors.surface} />
                  <Text style={styles.cardCallBtnText}>
                    {isMarathi ? 'कॉल करा' : 'Call'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleDirections(selectedPoint)}
                style={styles.cardDirectionsBtn}
              >
                <Ionicons name="navigate" size={16} color={colors.surface} />
                <Text style={styles.cardDirectionsBtnText}>
                  {isMarathi ? 'दिशा दर्शन' : 'Directions'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.maroon,
  },
  headerSubtitleText: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 1,
    fontWeight: '700',
  },
  recenterHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(230, 81, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tacticalHudBanner: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    zIndex: 10,
  },
  hudTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hudBadgeMoving: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  hudBadgeArrived: {
    backgroundColor: '#059669',
  },
  pulseDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  hudBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 0.5,
  },
  hudDistanceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  hudBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  hudCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  hudCallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  hudEscalateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 6,
    gap: 4,
  },
  hudEscalateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  hudResolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 6,
    gap: 4,
  },
  hudResolveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sosStatusBannerWaiting: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  sosBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sosBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sosBannerSubtext: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 1,
  },
  filterStripContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5EFEB',
    borderWidth: 1,
    borderColor: '#E8DED4',
  },
  filterChipActive: {
    backgroundColor: colors.maroon,
    borderColor: colors.maroon,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  mapFrame: {
    position: 'relative',
    overflow: 'hidden',
  },
  mapFramePreview: {
    height: 215,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFE2D3',
    backgroundColor: '#FFF8E7',
  },
  mapFrameFullScreen: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  previewClickableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.02)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 10,
  },
  expandButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  expandButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    top: 14,
    gap: 8,
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EAE0D5',
  },
  infoCardWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    zIndex: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: colors.maroon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3E5AB',
  },
  cardCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5ECE1',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 32,
    marginBottom: 8,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderCol: {
    flex: 1,
  },
  cardNameText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  cardDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  cardDistanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.maroon,
  },
  cardStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDescText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.maroon,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  cardCallBtnText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  cardDirectionsBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.saffronDark,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  cardDirectionsBtnText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
});

export default VarkariInteractiveMap;
