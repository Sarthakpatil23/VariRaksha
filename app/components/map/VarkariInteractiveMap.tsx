import React, { useState, useRef, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import {
  MapPoint,
  WARI_FULL_PALKHI_ROUTE,
  WARI_ACTIVE_SEGMENT,
  CURRENT_PILGRIM_LOCATION,
  MAP_SERVICE_POINTS,
} from './mapData';
import { colors, spacing, typography } from '../../constants';

export type MapCategoryFilter =
  | 'all'
  | 'medical'
  | 'water'
  | 'food'
  | 'volunteer'
  | 'rest'
  | 'toilet'
  | 'religious';

interface VarkariInteractiveMapProps {
  isFullScreen?: boolean;
  onClose?: () => void;
  onExpand?: () => void;
  initialSelectedId?: string | null;
}

export const VarkariInteractiveMap: React.FC<VarkariInteractiveMapProps> = ({
  isFullScreen = false,
  onClose,
  onExpand,
  initialSelectedId = null,
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

  const getLocalizedServices = (point: MapPoint) => {
    if (isMarathi) return point.servicesMr;
    if (isHindi) return point.servicesHi;
    return point.servicesEn;
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
            if (point) {
              setSelectedPoint(point);
            }
          } else if (data && data.type === 'pilgrim_click') {
            showPilgrimAlert();
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
  }, [isMarathi, isHindi]);

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

  // Generate Base Leaflet Map HTML (Loaded once)
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

    @keyframes radarPulse {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.9); opacity: 0; }
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

    // High performance OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Full 256 km Palkhi Route from Alandi/Pune to Pandharpur
    var fullRouteCoords = ${fullRouteJson};
    var fullPolyline = L.polyline(fullRouteCoords, {
      color: '#2E7D32',
      weight: 3.5,
      opacity: 0.65,
      dashArray: '5, 8',
      lineCap: 'round'
    }).addTo(map);

    // Active Highway Segment (Phaltan -> Wakhari -> Pandharpur)
    var activeRouteCoords = ${activeRouteJson};

    // Glowing Underlay Route
    var polylineGlow = L.polyline(activeRouteCoords, {
      color: '#FFB74D',
      weight: 8,
      opacity: 0.5,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Precise Street Highway Polyline
    var polyline = L.polyline(activeRouteCoords, {
      color: '#E65100',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // SVG Vector Pin Templates
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
        case 'religious':
          return '<path d="M18 7L24 12H12L18 7ZM13 13H23V21H13V13ZM18 5V7M16 5H20" stroke="' + color + '" stroke-width="2" stroke-linecap="round"/>';
        case 'destination':
          return '<path d="M12 7L20 11L12 15V22M12 7V22" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
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

    // Service Markers Map
    var allPoints = ${pointsJson};
    var markerLayerGroup = L.layerGroup().addTo(map);
    var markerMap = {};

    function renderMarkers(categoryFilter) {
      markerLayerGroup.clearLayers();
      markerMap = {};

      allPoints.forEach(function(p) {
        if (categoryFilter !== 'all' && p.category !== categoryFilter) {
          return;
        }

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
          map.setView([${pilgrimLat}, ${pilgrimLng}], 15, { animate: true });
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
        if (point) {
          setSelectedPoint(point);
        }
      } else if (data.type === 'pilgrim_click') {
        showPilgrimAlert();
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
              {isMarathi ? 'वारी पालखी मार्ग' : isHindi ? 'वारी पालकी मार्ग' : 'Wari Palkhi Route'}
            </Text>
            <Text style={styles.headerSubtitleText}>
              {isMarathi
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

      {/* Category Filter Chips Strip (Available in Full Screen) */}
      {isFullScreen && (
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

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedCategory('rest')}
              style={[
                styles.filterChip,
                selectedCategory === 'rest' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'rest' && styles.filterChipTextActive,
                ]}
              >
                ⛺ {isMarathi ? 'विश्रांती' : 'Rest'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedCategory('toilet')}
              style={[
                styles.filterChip,
                selectedCategory === 'toilet' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'toilet' && styles.filterChipTextActive,
                ]}
              >
                🚻 {isMarathi ? 'स्वच्छतागृह' : 'Toilets'}
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
                {isMarathi ? 'नकाशा उघडा' : isHindi ? 'नक्शा खोलें' : 'Open Map'}
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

      {/* Selected Marker Detail Card (Bottom Sheet Overlay in Full Screen) */}
      {isFullScreen && selectedPoint && (
        <View style={styles.infoCardWrapper}>
          <View style={styles.infoCard}>
            {/* Close card button */}
            <TouchableOpacity
              onPress={() => setSelectedPoint(null)}
              style={styles.cardCloseBtn}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Header: Badge, Name, Distance */}
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
                      : selectedPoint.iconType === 'rest'
                      ? 'bed'
                      : selectedPoint.iconType === 'toilet'
                      ? 'body'
                      : selectedPoint.iconType === 'religious'
                      ? 'flame'
                      : 'flag'
                  }
                  size={22}
                  color={colors.surface}
                />
              </View>

              <View style={styles.cardTitleInfo}>
                <Text style={styles.cardTitleText}>
                  {getLocalizedName(selectedPoint)}
                </Text>
                <Text style={styles.cardDistanceText}>
                  📍 {getLocalizedDistance(selectedPoint)} · {getLocalizedWalkTime(selectedPoint)}
                </Text>
              </View>
            </View>

            {/* Status Line */}
            <View style={styles.statusBox}>
              <Text style={styles.statusBoxText}>
                {getLocalizedStatus(selectedPoint)}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.cardDescText}>
              {getLocalizedDesc(selectedPoint)}
            </Text>

            {/* Available Services Badges */}
            <View style={styles.servicesRow}>
              {getLocalizedServices(selectedPoint).map((srv, idx) => (
                <View key={idx} style={styles.serviceBadge}>
                  <Text style={styles.serviceBadgeText}>✓ {srv}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleDirections(selectedPoint)}
                style={[styles.cardBtn, styles.cardBtnPrimary]}
              >
                <Ionicons name="navigate" size={16} color={colors.surface} />
                <Text style={styles.cardBtnPrimaryText}>
                  {isMarathi ? 'मार्गदर्शन' : isHindi ? 'दिशानिर्देश' : 'Get Directions'}
                </Text>
              </TouchableOpacity>

              {selectedPoint.phone && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleCall(selectedPoint.phone)}
                  style={[styles.cardBtn, styles.cardBtnCall]}
                >
                  <Ionicons name="call" size={16} color={colors.maroon} />
                  <Text style={styles.cardBtnCallText}>
                    {isMarathi ? 'कॉल करा' : isHindi ? 'कॉल करें' : 'Call'}
                  </Text>
                </TouchableOpacity>
              )}
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
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  headerSubtitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.saffronDark,
  },
  recenterHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterStripContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.maroon,
    borderColor: colors.maroon,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  mapFrame: {
    overflow: 'hidden',
    position: 'relative',
  },
  mapFramePreview: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapFrameFullScreen: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.maroon,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  expandButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.surface,
  },
  floatingControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
  },
  floatingBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  cardCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    zIndex: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 24,
    marginBottom: 8,
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitleInfo: {
    flex: 1,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  cardDistanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.maroon,
    marginTop: 2,
  },
  statusBox: {
    backgroundColor: '#F3FBF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  statusBoxText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  cardDescText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  serviceBadge: {
    backgroundColor: '#FFF9ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8D4004',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  cardBtnPrimary: {
    flex: 1,
    backgroundColor: colors.saffronDark,
  },
  cardBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.surface,
  },
  cardBtnCall: {
    paddingHorizontal: 14,
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#F8BBD0',
  },
  cardBtnCallText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.maroon,
  },
});

export default VarkariInteractiveMap;
