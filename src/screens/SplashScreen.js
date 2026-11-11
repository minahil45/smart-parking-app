import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

const { width: W, height: H } = Dimensions.get('window');

const CX = W / 2;
const CY = H * 0.35;
const SCALE = W / 250;

// Buildings ki area ki total height (screen ke neeche se)
// Ye hamesha sab se lambi building se thori zyada honi chahiye
const CITY_H = 185 * SCALE;

// [x, width, height], 250px design ke hisab se
// Gap original design ka hissa hai, height badhane ke liye third number badlo
const BUILDINGS = [
  [0, 28, 130],
  [32, 36, 165],
  [72, 28, 100],
  [104, 33, 145],
  [140, 30, 95],
  [173, 38, 175],
  [214, 36, 118],
];

export default function SplashScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_800ExtraBold,
  });

  const progress = useRef(new Animated.Value(0)).current;
  const pinScale = useRef(new Animated.Value(0.6)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.parallel([
      Animated.spring(pinScale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      router.replace('/welcome');
    });
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient colors={['#1D4ED8', '#1E3A9E']} style={styles.container}>
      {/* Rings aur bara circle */}
      <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
        <Circle cx={CX} cy={CY} r={W * 0.78} stroke="#fff" strokeOpacity={0.08} strokeWidth={1} fill="none" />
        <Circle cx={CX} cy={CY} r={W * 0.58} stroke="#fff" strokeOpacity={0.12} strokeWidth={1} fill="none" />
        <Circle cx={CX} cy={CY} r={W * 0.43} stroke="#fff" strokeOpacity={0.15} strokeWidth={1} fill="none" />
        <Circle cx={CX} cy={CY} r={W * 0.30} fill="#fff" fillOpacity={0.12} />
      </Svg>

      {/* Buildings: hamesha screen ke bilkul neeche */}
      <View style={styles.city}>
        <Svg width={W} height={CITY_H}>
          {BUILDINGS.map(([x, w, h], i) => (
            <Rect
              key={i}
              x={x * SCALE}
              y={CITY_H - h * SCALE}
              width={w * SCALE}
              height={h * SCALE}
              fill="#4F7CE8"
              fillOpacity={0.45}
            />
          ))}
        </Svg>
      </View>

      {/* Location pin + car */}
      <Animated.View
        style={[styles.pinWrap, { opacity: fade, transform: [{ scale: pinScale }] }]}
      >
        <Svg width={100} height={140} viewBox="0 0 100 130">
          <Path
            d="M50 0 C22 0 0 22 0 50 C0 85 50 130 50 130 C50 130 100 85 100 50 C100 22 78 0 50 0 Z"
            fill="#fff"
          />
          <Circle cx={50} cy={50} r={33} fill="#1D4ED8" />
          <Path d="M30 52 L36 41 Q38 37 43 37 L57 37 Q62 37 64 41 L70 52 Z" fill="#fff" />
          <Rect x={26} y={50} width={48} height={14} rx={5} fill="#fff" />
          <Circle cx={38} cy={65} r={5} fill="#fff" stroke="#1D4ED8" strokeWidth={2.5} />
          <Circle cx={62} cy={65} r={5} fill="#fff" stroke="#1D4ED8" strokeWidth={2.5} />
        </Svg>
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.textWrap, { opacity: fade }]}>
        <Text style={styles.title}>Smart Parking{'\n'}Finder</Text>
        <Text style={styles.subtitle}>FIND. PARK. GO.</Text>
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: barWidth }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  city: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  pinWrap: {
    position: 'absolute',
    top: H * 0.28,
    left: CX - 50,
  },
  textWrap: {
    position: 'absolute',
    top: H * 0.5,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    lineHeight: 32,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    letterSpacing: 4,
    color: '#fff',
    opacity: 0.85,
  },
  track: {
    position: 'absolute',
    bottom: H * 0.18,
    alignSelf: 'center',
    width: W * 0.32,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});