import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

// Font size screen width ke hisab se scale hota hai, lekin limit ke andar
const scaleFont = (width, size) =>
  Math.round(size * Math.min(Math.max(width / 375, 0.85), 1.15));

// Official Google "G" logo
function GoogleIcon({ size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

// Small pin logo at the top
function PinLogo({ size = 26 }) {
  return (
    <Svg width={size} height={size * 1.3} viewBox="0 0 100 130">
      <Path
        d="M50 0 C22 0 0 22 0 50 C0 85 50 130 50 130 C50 130 100 85 100 50 C100 22 78 0 50 0 Z"
        fill="#fff"
      />
      <Circle cx={50} cy={50} r={26} fill="#1D4ED8" />
      <Circle cx={50} cy={50} r={12} fill="#fff" />
    </Svg>
  );
}

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const styles = makeStyles(width, height, insets);
  const iconSize = scaleFont(width, 18);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerText, setBannerText] = useState('');

  const fade = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(-height * 0.2)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!fontsLoaded) return null;

  // Slide-down notification at the top of the screen
  const showBanner = (message) => {
    setBannerText(message);
    Animated.timing(bannerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSignUp = async () => {
    if (loading) return;

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Save the full name so the Home screen can show it later
      await updateProfile(cred.user, { displayName: fullName.trim() });

      setLoading(false);
      showBanner('Account created successfully');

      // Wait a moment so the user can see the notification, then go to Login
      setTimeout(() => {
        router.replace({ pathname: '/login', params: { email: email.trim() } });
      }, 1600);
    } catch (error) {
      setLoading(false);

      if (error.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Account exists',
          'This email is already registered. Please log in instead.'
        );
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Weak password', 'Password must be at least 6 characters.');
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Network error', 'Please check your internet connection.');
      } else if (error.code === 'auth/operation-not-allowed') {
        Alert.alert(
          'Not enabled',
          'Enable Email/Password sign-in in the Firebase console.'
        );
      } else {
        Alert.alert('Sign up failed', error.message);
      }
    }
  };

  const handleGoogle = () => {
    // Google sign-in will be added later
    Alert.alert('Coming soon', 'Google sign-in is not set up yet');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Success notification */}
      <Animated.View
        style={[
          styles.banner,
          { top: insets.top + height * 0.01, transform: [{ translateY: bannerAnim }] },
        ]}
      >
        <Ionicons name="checkmark-circle" size={iconSize} color="#fff" />
        <Text style={styles.bannerText}>{bannerText}</Text>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fade }]}>
        {/* Top: logo + title */}
        <View>
          <View style={styles.logoBox}>
            <PinLogo size={width * 0.065} />
          </View>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Sign up to start finding parking</Text>
        </View>

        {/* Middle: form */}
        <View>
          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={iconSize} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={iconSize} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={iconSize} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              textContentType="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={iconSize}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          {/* Sign Up button */}
          <TouchableOpacity
            style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.8}
            onPress={handleGoogle}
          >
            <GoogleIcon size={scaleFont(width, 20)} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom: footer */}
        <View style={styles.footer}>
          <Text style={styles.footerGray}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (width, height, insets) => {
  // Helpers: screen ka percentage
  const w = (p) => width * p;
  const h = (p) => height * p;
  const f = (size) => scaleFont(width, size);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f1f4f7',
    },

    content: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: w(0.07),
      paddingTop: insets.top + h(0.01),
      paddingBottom: insets.bottom + h(0.10),
    },

    banner: {
      position: 'absolute',
      left: w(0.05),
      right: w(0.05),
      zIndex: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#16A34A',
      borderRadius: w(0.03),
      paddingVertical: h(0.013),
      paddingHorizontal: w(0.035),
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    bannerText: {
      marginLeft: w(0.02),
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: f(14),
      color: '#fff',
    },

    logoBox: {
      width: w(0.14),
      height: w(0.14),
      borderRadius: w(0.035),
      backgroundColor: '#1D4ED8',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: h(0.025),
      shadowColor: '#1D4ED8',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    title: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: f(28),
      color: '#0B0B0F',
    },
    subtitle: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: f(14),
      color: '#6B7280',
      marginTop: h(0.005),
    },

    label: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: f(13),
      color: '#111827',
      marginTop: h(0.02),
      marginBottom: h(0.01),
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      height: h(0.065),
      borderWidth: 1.5,
      borderColor: '#DCE6F8',
      borderRadius: w(0.03),
      backgroundColor: '#FFFFFF',
      paddingHorizontal: w(0.035),
    },
    input: {
      flex: 1,
      marginLeft: w(0.025),
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: f(15),
      color: '#111827',
      paddingVertical: 0,
    },

    signupBtn: {
      height: h(0.065),
      borderRadius: w(0.035),
      backgroundColor: '#1D4ED8',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: h(0.03),
      shadowColor: '#1D4ED8',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 5,
    },
    signupBtnDisabled: {
      opacity: 0.7,
    },
    signupText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: f(16),
      color: '#fff',
    },

    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: h(0.025),
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#D7DEE8',
    },
    dividerText: {
      marginHorizontal: w(0.03),
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: f(13),
      color: '#9CA3AF',
    },

    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: h(0.065),
      borderRadius: w(0.035),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#fff',
    },
    googleText: {
      marginLeft: w(0.025),
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: f(15),
      color: '#111827',
    },

    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerGray: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: f(13),
      color: '#4B5563',
    },
    footerLink: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: f(13),
      color: '#1D4ED8',
      textDecorationLine: 'underline',
    },
  });
};