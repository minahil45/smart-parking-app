import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import Svg, { Rect, Path, Circle, Ellipse, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

// Map ka design coordinate system (sirf ratio ke liye, pixel nahi)
const DESIGN_W = 240;
const DESIGN_H = 290;

// Map ki height screen ka percentage hai
const MAP_RATIO = 0.46;

// Dotted path ke 4 points (design units)
const P0 = [42, 253]; // start (neeche wala circle)
const P1 = [60, 190];
const P2 = [170, 205];
const P3 = [155, 118]; // end (upar shadow)

const STEPS = 40;
const DOTS = 22;

// Bezier curve par point (design units mein)
const bezDesign = (t) => {
  const m = 1 - t;
  const x =
    m * m * m * P0[0] +
    3 * m * m * t * P1[0] +
    3 * m * t * t * P2[0] +
    t * t * t * P3[0];
  const y =
    m * m * m * P0[1] +
    3 * m * m * t * P1[1] +
    3 * m * t * t * P2[1] +
    t * t * t * P3[1];
  return [x, y];
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const mapW = width;
  const mapH = height * MAP_RATIO;

  // Design point ko actual screen pixel mein convert karta hai
  const toPx = (x, y) => [(x / DESIGN_W) * mapW, (y / DESIGN_H) * mapH];
  const bezPx = (t) => {
    const [x, y] = bezDesign(t);
    return toPx(x, y);
  };

  // Pin ka size screen width ke hisab se
  const PW = mapW * 0.167;
  const PH = PW * 1.3;

  const styles = makeStyles(width, height, insets);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const progress = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.sequence([
      Animated.delay(500),
      Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      // pin ruk kar thora bounce kare
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.18, duration: 150, useNativeDriver: true }),
        Animated.spring(bounce, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // Pin ki position: path ke points par interpolate
  const inputRange = [];
  const xs = [];
  const ys = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const [x, y] = bezPx(t);
    inputRange.push(t);
    xs.push(x - PW / 2);
    ys.push(y - PH);
  }
  const pinX = progress.interpolate({ inputRange, outputRange: xs });
  const pinY = progress.interpolate({ inputRange, outputRange: ys });

  // Dotted line
  const dotSize = mapW * 0.021;
  const dots = [];
  for (let i = 1; i <= DOTS; i++) {
    const t = i / (DOTS + 1);
    const [x, y] = bezPx(t);
    const opacity = progress.interpolate({
      inputRange: [Math.max(0, t - 0.06), t],
      outputRange: [0.3, 1],
      extrapolate: 'clamp',
    });
    dots.push(
      <Animated.View
        key={i}
        style={{
          position: 'absolute',
          left: x - dotSize / 2,
          top: y - dotSize / 2,
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: '#1D4ED8',
          opacity,
        }}
      />
    );
  }

  const [sx, sy] = bezPx(0);
  const [ex, ey] = bezPx(1);

  // Start circle size
  const startSize = mapW * 0.067;

  // Shadow size
  const shadowW = mapW * 0.25;
  const shadowH = mapW * 0.1;

  return (
    <View style={styles.container}>
      {/* ---------- MAP ---------- */}
      <View style={styles.map}>
        <Svg
          width={mapW}
          height={mapH}
          viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Rect x={0} y={0} width={240} height={290} fill="#E6EEFC" />

          {/* Blocks */}
          <Rect x={112} y={205} width={48} height={48} rx={6} fill="#CFDDF7" />
          <Rect x={-10} y={70} width={55} height={50} rx={6} fill="#DCE7FA" />

          {/* Roads */}
          <Path d="M-10 150 L250 118" stroke="#fff" strokeWidth={14} />
          <Path d="M72 -10 L98 300" stroke="#fff" strokeWidth={13} />
          <Path d="M165 -10 L180 300" stroke="#fff" strokeWidth={13} />
          <Path d="M-10 235 L250 205" stroke="#fff" strokeWidth={9} />
          <Path d="M-10 40 L250 60" stroke="#fff" strokeWidth={8} />
          <Path d="M20 -10 L35 300" stroke="#fff" strokeWidth={6} />
          <Path d="M215 -10 L225 300" stroke="#fff" strokeWidth={6} />
        </Svg>

        {/* Shadow: jahan pin ruke ga */}
        <Svg
          width={shadowW}
          height={shadowH}
          viewBox="0 0 60 24"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            left: ex - shadowW / 2,
            top: ey - shadowH / 2,
          }}
        >
          <Ellipse cx={30} cy={12} rx={22} ry={8} fill="#6B7280" opacity={0.12} />
          <Ellipse cx={30} cy={12} rx={14} ry={4.5} fill="#6B7280" opacity={0.28} />
        </Svg>

        {/* Start circle */}
        <View
          style={{
            position: 'absolute',
            left: sx - startSize / 2,
            top: sy - startSize / 2,
            width: startSize,
            height: startSize,
            borderRadius: startSize / 2,
            borderWidth: mapW * 0.0125,
            borderColor: '#1D4ED8',
            backgroundColor: '#fff',
          }}
        />

        {/* Dotted line */}
        {dots}

        {/* Moving PIN */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: [{ translateX: pinX }, { translateY: pinY }, { scale: bounce }],
          }}
        >
          <Svg width={PW} height={PH} viewBox="0 0 100 130">
            <Path
              d="M50 0 C22 0 0 22 0 50 C0 85 50 130 50 130 C50 130 100 85 100 50 C100 22 78 0 50 0 Z"
              fill="#1D4ED8"
            />
            <Circle cx={50} cy={48} r={30} fill="#fff" />
            <Circle cx={50} cy={48} r={24} fill="#1D4ED8" />
            <SvgText
              x={50}
              y={62}
              fontSize={38}
              fontWeight="bold"
              fill="#fff"
              textAnchor="middle"
            >
              P
            </SvgText>
          </Svg>
        </Animated.View>

        {/* Nearby parking card */}
        <View style={styles.card}>
          <View style={styles.cardDot} />
          <View>
            <Text style={styles.cardSmall}>Nearby parking</Text>
            <Text style={styles.cardBig}>12 slots free</Text>
          </View>
        </View>

        {/* 0.5 km pill */}
        <View style={styles.pill}>
          <Text style={styles.pillText}>0.5 km away</Text>
        </View>
      </View>

      {/* ---------- BOTTOM ---------- */}
      <View style={styles.bottom}>
        <View>
          <Text style={styles.welcome}>Welcome to</Text>
          <Text style={styles.brand}>Smart Parking Finder</Text>
          <Text style={styles.desc}>
            Find the best parking spots near you, easily and quickly.
          </Text>
        </View>

        <View>
          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.btnText}>Get Started</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginGray}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (width, height, insets) => {
  const mapH = height * MAP_RATIO;

  // Helpers: screen ka percentage
  const w = (p) => width * p;
  const h = (p) => height * p;

  // Font size: 375px phone ke base par, lekin limit ke andar
  const f = (size) => Math.round(size * Math.min(Math.max(width / 375, 0.85), 1.15));

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f4f7' },

    map: {
      width: width,
      height: mapH,
      backgroundColor: '#E6EEFC',
      borderBottomLeftRadius: w(0.09),
      borderBottomRightRadius: w(0.09),
      overflow: 'hidden',
    },

    card: {
      position: 'absolute',
      left: w(0.06),
      top: mapH * 0.128,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingVertical: h(0.013),
      paddingHorizontal: w(0.03),
      borderRadius: w(0.045),
      elevation: 4,
      shadowColor: '#1D4ED8',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    cardDot: {
      width: w(0.03),
      height: w(0.03),
      borderRadius: w(0.015),
      backgroundColor: '#1D4ED8',
      marginRight: w(0.025),
    },
    cardSmall: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: f(10),
      color: '#6B7280',
    },
    cardBig: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: f(12),
      color: '#111827',
    },

    pill: {
      position: 'absolute',
      right: w(0.067),
      top: mapH * 0.8,
      backgroundColor: '#0F1F5C',
      paddingVertical: h(0.013),
      paddingHorizontal: w(0.03),
      borderRadius: w(0.03),
    },
    pillText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: f(12),
      color: '#fff',
    },

    bottom: {
      flex: 1,
      paddingHorizontal: w(0.07),
      paddingTop: h(0.035),
      paddingBottom: insets.bottom + h(0.090),
      justifyContent: 'space-between',
    },
    welcome: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: f(25),
      color: '#0B0B0F',
    },
    brand: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: f(25),
      color: '#1D4ED8',
      marginBottom: h(0.012),
    },
    desc: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: f(13),
      lineHeight: Math.round(f(15) * 1.45),
      color: '#4B5563',
    },

    btn: {
      backgroundColor: '#1D4ED8',
      height: h(0.065),
      borderRadius: w(0.035),
      justifyContent: 'center',
      alignItems: 'center',
    },
    btnText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: f(16),
      color: '#fff',
    },
    loginRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: h(0.017),
    },
    loginGray: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: f(13),
      color: '#4B5563',
    },
    loginLink: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: f(13),
      color: '#1D4ED8',
      textDecorationLine: 'underline',
    },
  });
};