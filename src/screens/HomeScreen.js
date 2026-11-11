import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

// Default area used when location permission is denied (Lahore)
const FALLBACK = { lat: 31.5204, lng: 74.3587 };

const QUICK_ACTIONS = [
  { label: 'Nearby Parking', icon: 'location-outline' },
  { label: 'Basement Parking', icon: 'layers-outline' },
  { label: 'My Bookings', icon: 'receipt-outline' },
];

const TABS = [
  { key: 'Home', label: 'Home', icon: 'home', iconOff: 'home-outline' },
  { key: 'Bookings', label: 'Bookings', icon: 'ticket', iconOff: 'ticket-outline' },
  { key: 'Notifications', label: 'Notifications', icon: 'notifications', iconOff: 'notifications-outline' },
  { key: 'Profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

// Leaflet map HTML (free, no API key)
const buildMapHtml = (lat, lng) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
    .pin {
      width: 30px; height: 30px;
      background: #1D4ED8;
      border: 2px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    }
    .pin span { transform: rotate(45deg); color: #fff; font: 700 14px sans-serif; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Blue dot for the selected position
    L.circleMarker([${lat}, ${lng}], {
      radius: 9, color: '#fff', weight: 3, fillColor: '#1D4ED8', fillOpacity: 1
    }).addTo(map);

    var spotLayer = L.layerGroup().addTo(map);

    // Parking spots come from React Native
    window.setSpots = function (spots) {
      spotLayer.clearLayers();
      spots.forEach(function (s) {
        L.marker([s.lat, s.lng], {
          icon: L.divIcon({ className: '', html: '<div class="pin"><span>P</span></div>', iconSize: [30, 30], iconAnchor: [15, 30] })
        })
          .bindPopup(s.name)
          .addTo(spotLayer);
      });
    };
  </script>
</body>
</html>`;

// Free OpenStreetMap parking data (Overpass API)
async function fetchParking({ lat, lng }) {
  const query = `[out:json][timeout:25];
(
  node["amenity"="parking"](around:5000,${lat},${lng});
  way["amenity"="parking"](around:5000,${lat},${lng});
);
out center 60;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) return [];

  const json = await res.json();
  return (json.elements || [])
    .map((el) => {
      const la = el.lat ?? el.center?.lat;
      const lo = el.lon ?? el.center?.lon;
      if (!la || !lo) return null;
      return {
        id: el.id,
        lat: la,
        lng: lo,
        name: el.tags?.name || 'Parking area',
      };
    })
    .filter(Boolean);
}

// Free place search (Nominatim)
async function searchPlace(text) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=pk&q=' +
    encodeURIComponent(text);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'SmartParkingFinder/1.0 (student project)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) return [];
  return await res.json();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Name passed from Sign Up (falls back to "User")
  const name =
    typeof params.name === 'string' && params.name.trim() ? params.name : 'User';

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const [coords, setCoords] = useState(null);
  const [spots, setSpots] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');
  const [search, setSearch] = useState('');
  const webRef = useRef(null);

  // Get location, then load parking spots
  useEffect(() => {
    (async () => {
      let loc = FALLBACK;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } else {
          Alert.alert(
            'Location off',
            'Allow location to see parking near you. Showing default area for now.'
          );
        }
      } catch (e) {
        // Use the fallback area if location fails
      }

      setCoords(loc);

      try {
        setSpots(await fetchParking(loc));
      } catch (e) {
        setSpots([]);
      }
    })();
  }, []);

  // Map source is rebuilt only when the position changes
  const mapSource = useMemo(
    () => (coords ? { html: buildMapHtml(coords.lat, coords.lng) } : null),
    [coords]
  );

  const pushSpots = (list) => {
    webRef.current?.injectJavaScript(
      `window.setSpots && window.setSpots(${JSON.stringify(list)}); true;`
    );
  };

  // Draw pins whenever spots change
  useEffect(() => {
    pushSpots(spots);
  }, [spots]);

  // Search a place, move the map there, then load parking around it
  const handleSearch = async () => {
    const text = search.trim();
    if (!text) return;

    try {
      const results = await searchPlace(text);
      if (!results.length) {
        Alert.alert('Not found', 'No place found for this search');
        return;
      }

      const place = results[0];
      const loc = { lat: parseFloat(place.lat), lng: parseFloat(place.lon) };

      setSpots([]);
      setCoords(loc);

      const found = await fetchParking(loc);
      setSpots(found);
    } catch (e) {
      Alert.alert('Search failed', 'Please check your internet connection');
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={['#1E3A9E', '#1D4ED8']}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.hello}>{`Hello, ${name}`}</Text>
            <Text style={styles.sub}>Find parking near you</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <TouchableOpacity onPress={handleSearch} activeOpacity={0.7}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Search parking locations..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
      </LinearGradient>

      {/* Map */}
      <View style={styles.mapWrap}>
        {mapSource ? (
          <WebView
            ref={webRef}
            source={mapSource}
            originWhitelist={['*']}
            javaScriptEnabled
            style={styles.map}
            onLoadEnd={() => pushSpots(spots)}
          />
        ) : (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={styles.loaderText}>Loading map...</Text>
          </View>
        )}

        {mapSource && (
          <View style={styles.countChip}>
            <Text style={styles.countText}>
              {spots.length > 0
                ? `${spots.length} parking spots nearby`
                : 'No parking data nearby'}
            </Text>
          </View>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.quickCard}>
        {QUICK_ACTIONS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickItem}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Coming soon', `${item.label} will be added next.`)}
          >
            <View style={styles.quickIconBox}>
              <Ionicons name={item.icon} size={20} color="#1D4ED8" />
            </View>
            <Text style={styles.quickText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => setActiveTab(tab.key)}
            >
              {active && <View style={styles.tabIndicator} />}
              <Ionicons
                name={active ? tab.icon : tab.iconOff}
                size={22}
                color={active ? '#1D4ED8' : '#9CA3AF'}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F4F7',
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  hello: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    color: '#fff',
  },
  sub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },

  mapWrap: {
    flex: 1,
    backgroundColor: '#E6EEFC',
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#6B7280',
  },
  countChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  countText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#111827',
  },

  quickCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: -20,
    marginBottom: 12,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 6,
    elevation: 6,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  quickItem: {
    width: 100,
    alignItems: 'center',
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
  },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1D4ED8',
  },
  tabText: {
    marginTop: 3,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
  },
  tabTextActive: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1D4ED8',
  },
});