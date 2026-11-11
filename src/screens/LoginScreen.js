import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

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

// Styles are built from the current screen size, so every phone gets its own layout
const makeStyles = (width, height, insets) => {
  // Percentage of screen width / height
  const w = (p) => width * p;
  const h = (p) => height * p;

  // Font size that grows or shrinks with screen width (kept within a safe range)
  const f = (size) => {
    const scaled = (width / 375) * size;
    return Math.round(Math.min(Math.max(scaled, size * 0.85), size * 1.15));
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingHorizontal: w(0.07),
      paddingTop: insets.top + h(0.06),
      paddingBottom: insets.bottom + h(0.03),
      justifyContent: 'space-between',
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
      marginBottom: h(0.03),
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

    label: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: f(13),
      color: '#111827',
      marginTop: h(0.015),
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

    forgotWrap: {
      alignSelf: 'flex-end',
      marginTop: h(0.012),
    },
    forgotText: {
      fontFamily: 'PlusJakartaSans_500Medium',
      fontSize: f(13),
      color: '#1D4ED8',
    },

    bottomBlock: {
      width: '100%',
    },
    loginBtn: {
      height: h(0.067),
      borderRadius: w(0.035),
      backgroundColor: '#1D4ED8',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#1D4ED8',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 5,
    },
    loginBtnDisabled: {
      opacity: 0.7,
    },
    loginText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: f(16),
      color: '#fff',
    },

    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: h(0.025),
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

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const styles = makeStyles(width, height, insets);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Email signup se aaya ho to pehle se bhara hoga
  const [email, setEmail] = useState(
    typeof params.email === 'string' ? params.email : ''
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!fontsLoaded) return null;

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Latest profile (displayName) load karein
      await cred.user.reload();

      const fullName = (cred.user.displayName || '').trim();
      const firstName = fullName ? fullName.split(' ')[0] : 'User';

      setLoading(false);

      router.replace({
        pathname: '/home',
        params: { name: firstName },
      });
    } catch (error) {
      setLoading(false);

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        Alert.alert('Login failed', 'Incorrect email or password');
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Network error', 'Please check your internet connection');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid email', 'Please enter a valid email address');
      } else {
        Alert.alert('Login failed', error.message);
      }
    }
  };

  const handleGoogle = () => {
    // Google sign-in will be added later
    Alert.alert('Coming soon', 'Google sign-in is not set up yet');
  };

  const handleForgot = () => {
    // Password reset will be added later
    Alert.alert('Coming soon', 'Forgot password is not set up yet');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Top content */}
        <View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.8}
            onPress={handleGoogle}
          >
            <GoogleIcon size={Math.round(width * 0.05)} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
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
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
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
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotWrap} onPress={handleForgot}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom block: Login button and Sign Up link */}
        <View style={styles.bottomBlock}>
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerGray}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}