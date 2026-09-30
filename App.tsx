import React, {useEffect, useState} from 'react';

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  StyleSheet,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import notifee, {
  AndroidImportance,
} from '@notifee/react-native';

import Geolocation from '@react-native-community/geolocation';

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from '@react-native-firebase/auth';

import {getMessaging} from '@react-native-firebase/messaging';

// =====================================================
// SCREEN TYPES
// =====================================================

type Screen =
  | 'splash'
  | 'welcome'
  | 'login'
  | 'signup'
  | 'vehicleConfirmation'
  | 'home'
  | 'parkingList'
  | 'parkingMap'
  | 'myBookings'
  | 'profile'
  | 'helpAbout';

// =====================================================
// STATIC PARKING DATA
// =====================================================

const parkingSpots = [
  {
    id: '1',
    name: 'City Center Parking',
    address: 'Main Boulevard, Block A',
    availableSlots: 12,
    pricePerHour: 'Rs. 50/hr',
    mapTop: '20%',
    mapLeft: '25%',
  },
  {
    id: '2',
    name: 'Mall Plaza Parking',
    address: 'Near Mall Plaza, Sector B',
    availableSlots: 5,
    pricePerHour: 'Rs. 40/hr',
    mapTop: '38%',
    mapLeft: '65%',
  },
  {
    id: '3',
    name: 'University Road Parking',
    address: 'University Road, Gate 2',
    availableSlots: 20,
    pricePerHour: 'Rs. 30/hr',
    mapTop: '55%',
    mapLeft: '30%',
  },
  {
    id: '4',
    name: 'Green Valley Parking',
    address: 'Green Valley Society Entrance',
    availableSlots: 0,
    pricePerHour: 'Rs. 35/hr',
    mapTop: '68%',
    mapLeft: '70%',
  },
  {
    id: '5',
    name: 'Airport Road Parking',
    address: 'Airport Road, Near Terminal 1',
    availableSlots: 8,
    pricePerHour: 'Rs. 60/hr',
    mapTop: '82%',
    mapLeft: '45%',
  },
];

// =====================================================
// APP
// =====================================================

const App = () => {
  // =====================================================
  // SCREEN
  // =====================================================

  const [screen, setScreen] = useState<Screen>('splash');

  // =====================================================
  // USER DATA
  // =====================================================

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // =====================================================
  // VEHICLE DATA
  // =====================================================

  const [vehicleType, setVehicleType] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  // =====================================================
  // PASSWORD
  // =====================================================

  const [showPassword, setShowPassword] = useState(false);

  // =====================================================
  // GPS
  // =====================================================

  const [latitude, setLatitude] = useState<number | null>(
    null,
  );

  const [longitude, setLongitude] = useState<number | null>(
    null,
  );

  const [locationLoading, setLocationLoading] =
    useState(false);

  // =====================================================
  // FCM
  // =====================================================

  const [fcmToken, setFcmToken] = useState('');

  // =====================================================
  // BOOKING DATA
  // =====================================================

  const [bookedParking, setBookedParking] = useState('');

  const [bookedParkingAddress, setBookedParkingAddress] =
    useState('');

  const [bookedDate, setBookedDate] = useState('');
  const [bookedTime, setBookedTime] = useState('');
  const [bookedPrice, setBookedPrice] = useState('');

  // =====================================================
  // FIREBASE AUTH
  // =====================================================

  const auth = getAuth();

  // =====================================================
  // LOCAL NOTIFICATION
  // =====================================================

  const showLocalNotification = async () => {
    try {
      await notifee.requestPermission();

      const channelId =
        await notifee.createChannel({
          id: 'parking-notifications',
          name: 'Parking Notifications',
          importance: AndroidImportance.HIGH,
        });

      await notifee.displayNotification({
        title: '🚗 Smart Parking Finder',
        body: 'Your parking notification is working successfully!',
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
        },
      });
    } catch (error) {
      console.log(
        'LOCAL NOTIFICATION ERROR:',
        error,
      );
    }
  };

  // =====================================================
  // FCM SETUP
  // =====================================================

  const setupFCM = async () => {
    try {
      const messagingInstance = getMessaging();

      await messagingInstance.requestPermission();

      const token =
        await messagingInstance.getToken();

      setFcmToken(token);

      console.log(
        '=================================',
      );

      console.log('FCM TOKEN:', token);

      console.log(
        '=================================',
      );
    } catch (error) {
      console.log('FCM ERROR:', error);
    }
  };

  // =====================================================
  // AUTO LOGIN
  // =====================================================

  useEffect(() => {
  const subscriber = onAuthStateChanged(
    auth,
    user => {
      if (user) {
        setFullName(user.displayName || '');
        setEmail(user.email || '');
        setScreen('home');

        setupFCM();
        showLocalNotification();
      } else {
        setScreen('welcome');
      }
    },
  );

  return subscriber;
}, [auth]);
  // =====================================================
  // SIGN UP
  // =====================================================

  const handleSignUp = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !vehicleType
    ) {
      Alert.alert(
        'Missing Information',
        'Please fill all fields.',
      );

      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters long.',
      );

      return;
    }

    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );

      await updateProfile(
        userCredential.user,
        {
          displayName: fullName.trim(),
        },
      );

      Alert.alert(
        'Success',
        'Your account has been created!',
      );

      setScreen('vehicleConfirmation');
    } catch (error: any) {
      let message =
        'Something went wrong. Please try again.';

      if (
        error.code ===
        'auth/email-already-in-use'
      ) {
        message =
          'This email is already registered. Please login.';
      } else if (
        error.code === 'auth/invalid-email'
      ) {
        message =
          'Please enter a valid email address.';
      } else if (
        error.code === 'auth/weak-password'
      ) {
        message =
          'Please choose a stronger password.';
      } else if (
        error.code ===
        'auth/operation-not-allowed'
      ) {
        message =
          'Email/Password sign-in is not enabled in Firebase.';
      }

      Alert.alert(
        'Signup Failed',
        `Error Code: ${
          error.code || 'unknown'
        }\nMessage: ${
          error.message || message
        }`,
      );
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter email and password.',
      );

      return;
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      Alert.alert(
        'Success',
        'You are now logged in!',
      );

      setScreen('home');
    } catch (error: any) {
      let message =
        'Unable to login. Please try again.';

      if (
        error.code ===
          'auth/invalid-credential' ||
        error.code ===
          'auth/wrong-password' ||
        error.code ===
          'auth/user-not-found'
      ) {
        message =
          'Email or password is incorrect.';
      } else if (
        error.code === 'auth/invalid-email'
      ) {
        message =
          'Please enter a valid email address.';
      } else if (
        error.code === 'auth/user-disabled'
      ) {
        message =
          'This account has been disabled.';
      }

      Alert.alert(
        'Login Failed',
        message,
      );
    }
  };

  // =====================================================
  // GPS FALLBACK
  // =====================================================

  const useFallbackLocation = () => {
    const fallbackLat = 31.5204;
    const fallbackLng = 74.3587;

    setLatitude(fallbackLat);
    setLongitude(fallbackLng);
    setLocationLoading(false);

    Alert.alert(
      'Using Default Location',
      'Could not get your exact GPS location, so showing parking near Lahore (default location).',
    );
  };

  // =====================================================
  // GET CURRENT LOCATION
  // =====================================================

  const getCurrentLocation = async () => {
    setLocationLoading(true);

    try {
      if (Platform.OS === 'android') {
        const granted =
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS
              .ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message:
                'Smart Parking Finder needs your location to find nearby parking.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );

        if (
          granted !==
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          setLocationLoading(false);

          useFallbackLocation();

          return;
        }
      }

      Geolocation.getCurrentPosition(
        position => {
          const lat =
            position.coords.latitude;

          const lng =
            position.coords.longitude;

          setLatitude(lat);
          setLongitude(lng);
          setLocationLoading(false);

          Alert.alert(
            'Location Found',
            `Latitude: ${lat}\nLongitude: ${lng}`,
          );
        },

        error => {
          console.log(
            'GPS Error:',
            error,
          );

          Geolocation.getCurrentPosition(
            position => {
              const lat =
                position.coords.latitude;

              const lng =
                position.coords.longitude;

              setLatitude(lat);
              setLongitude(lng);
              setLocationLoading(false);

              Alert.alert(
                'Location Found',
                `Latitude: ${lat}\nLongitude: ${lng}`,
              );
            },

            secondError => {
              console.log(
                'Second GPS Error:',
                secondError,
              );

              setLocationLoading(false);

              useFallbackLocation();
            },

            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000,
            },
          );
        },

        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 60000,
        },
      );
    } catch (error) {
      console.log(
        'Permission Error:',
        error,
      );

      setLocationLoading(false);

      useFallbackLocation();
    }
  };

  // =====================================================
  // BOOK PARKING
  // =====================================================

  const handleBookNow = (
    spotName: string,
    slots: number,
    address: string,
    price: string,
  ) => {
    if (slots === 0) {
      Alert.alert(
        'Not Available',
        `${spotName} is currently full. Please choose another spot.`,
      );

      return;
    }

    setBookedParking(spotName);

    setBookedParkingAddress(address);

    setBookedPrice(price);

    const now = new Date();

    setBookedDate(
      now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    );

    setBookedTime(
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    );

    Alert.alert(
      '🔔 Booking Confirmed',
      `Your parking slot at ${spotName} has been booked successfully!\n\n` +
        `Vehicle: ${vehicleType || 'Car'}\n` +
        `Number Plate: ${
          numberPlate || 'Not Added'
        }\n` +
        `Price: ${price}\n\n` +
        `You can view your booking in My Bookings.`,
      [
        {
          text: 'View My Bookings',
          onPress: () =>
            setScreen('myBookings'),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ],
    );
  };
    // =====================================================
  // LOCAL NOTIFICATION (Notifee)
  // =====================================================

  const handleTestNotification = async () => {
    try {
      await notifee.requestPermission();

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title: 'Booking Confirmed 🅿️',
        body: 'Your parking slot has been booked successfully!',
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      });
    } catch (error) {
      console.log('Notification Error:', error);
      Alert.alert(
        'Notification Error',
        'Could not display notification.',
      );
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setEmail('');
      setPassword('');
      setFullName('');

      setVehicleType('');
      setNumberPlate('');
      setVehicleModel('');

      setLatitude(null);
      setLongitude(null);

      setFcmToken('');

      setBookedParking('');
      setBookedParkingAddress('');
      setBookedDate('');
      setBookedTime('');
      setBookedPrice('');

      setScreen('welcome');
    } catch (error: any) {
      Alert.alert(
        'Logout Error',
        error.message ||
          'Unable to logout.',
      );
    }
  };

  // =====================================================
  // SPLASH SCREEN
  // =====================================================

  if (screen === 'splash') {
    return (
      <SafeAreaView
        style={styles.splashContainer}
      >
        <StatusBar barStyle="dark-content" />

        <Text style={styles.splashTitle}>
          Smart Parking Finder
        </Text>

        <Text
          style={styles.splashSubtitle}
        >
          Find parking easily and quickly
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            setScreen('welcome')
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Get Started
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // =====================================================
  // WELCOME SCREEN
  // =====================================================

  if (screen === 'welcome') {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Text style={styles.title}>
            Welcome
          </Text>

          <Text style={styles.subtitle}>
            Find your perfect parking spot
          </Text>

          <View
            style={styles.welcomeCard}
          >
            <Text
              style={styles.cardTitle}
            >
              Smart Parking Finder
            </Text>

            <Text
              style={styles.cardText}
            >
              Search nearby parking spaces
              and save your time.
            </Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              setScreen('login')
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Login
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              setScreen('signup')
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Create Account
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // LOGIN SCREEN
  // =====================================================

  if (screen === 'login') {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Pressable
            onPress={() =>
              setScreen('welcome')
            }
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Login
          </Text>

          <Text style={styles.subtitle}>
            Login to your Smart Parking
            account
          </Text>

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#A99A8E"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>
            Password
          </Text>

          <View
            style={
              styles.passwordContainer
            }
          >
            <TextInput
              style={
                styles.passwordInput
              }
              placeholder="Enter your password"
              placeholderTextColor="#A99A8E"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={
                !showPassword
              }
              autoComplete="password"
              textContentType="password"
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() =>
                setShowPassword(
                  !showPassword,
                )
              }
            >
              <Text
                style={styles.eyeIcon}
              >
                {showPassword
                  ? '🙈'
                  : '👁️'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={handleLogin}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Login
            </Text>
          </Pressable>

          <Pressable
            style={styles.googleButton}
            onPress={() =>
              Alert.alert(
                'Google Login',
                'Google Sign-In will be connected next.',
              )
            }
          >
            <Text
              style={
                styles.googleButtonText
              }
            >
              Continue with Google
            </Text>
          </Pressable>

          <View
            style={styles.bottomRow}
          >
            <Text
              style={styles.normalText}
            >
              Don't have an account?
            </Text>

            <Pressable
              onPress={() =>
                setScreen('signup')
              }
            >
              <Text
                style={styles.linkText}
              >
                {' '}Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // SIGN UP SCREEN
  // =====================================================

  if (screen === 'signup') {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Pressable
            onPress={() =>
              setScreen('welcome')
            }
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Create Account
          </Text>

          <Text style={styles.subtitle}>
            Create your Smart Parking
            account
          </Text>

          <Text style={styles.label}>
            Full Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#A99A8E"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#A99A8E"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>
            Password
          </Text>

          <View
            style={
              styles.passwordContainer
            }
          >
            <TextInput
              style={
                styles.passwordInput
              }
              placeholder="Create a password"
              placeholderTextColor="#A99A8E"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={
                !showPassword
              }
              autoComplete="password-new"
              textContentType="newPassword"
            />

            <Pressable
              style={styles.eyeButton}
              onPress={() =>
                setShowPassword(
                  !showPassword,
                )
              }
            >
              <Text
                style={styles.eyeIcon}
              >
                {showPassword
                  ? '🙈'
                  : '👁️'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>
            Vehicle Type
          </Text>

          <View
            style={styles.vehicleRow}
          >
            <Pressable
              style={[
                styles.vehicleButton,
                vehicleType === 'Car' &&
                  styles.vehicleSelected,
              ]}
              onPress={() =>
                setVehicleType('Car')
              }
            >
              <Text
                style={[
                  styles.vehicleText,
                  vehicleType === 'Car' &&
                    styles.vehicleSelectedText,
                ]}
              >
                🚗 Car
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.vehicleButton,
                vehicleType === 'Bike' &&
                  styles.vehicleSelected,
              ]}
              onPress={() =>
                setVehicleType('Bike')
              }
            >
              <Text
                style={[
                  styles.vehicleText,
                  vehicleType === 'Bike' &&
                    styles.vehicleSelectedText,
                ]}
              >
                🏍️ Bike
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={handleSignUp}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Sign Up
            </Text>
          </Pressable>

          <View
            style={styles.bottomRow}
          >
            <Text
              style={styles.normalText}
            >
              Already have an account?
            </Text>

            <Pressable
              onPress={() =>
                setScreen('login')
              }
            >
              <Text
                style={styles.linkText}
              >
                {' '}Login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // VEHICLE CONFIRMATION
  // =====================================================

  if (
    screen === 'vehicleConfirmation'
  ) {
    const handleVehicleConfirm =
      () => {
        if (!numberPlate.trim()) {
          Alert.alert(
            'Missing Information',
            'Please enter your vehicle number plate.',
          );

          return;
        }

        setScreen('home');
      };

    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Text style={styles.title}>
            Vehicle Confirmation
          </Text>

          <Text style={styles.subtitle}>
            Select your vehicle type and
            confirm details
          </Text>

          <Text style={styles.label}>
            Vehicle Type
          </Text>

          <View
            style={styles.vehicleRow}
          >
            <Pressable
              style={[
                styles.vehicleButton,
                vehicleType === 'Car' &&
                  styles.vehicleSelected,
              ]}
              onPress={() =>
                setVehicleType('Car')
              }
            >
              <Text
                style={[
                  styles.vehicleText,
                  vehicleType === 'Car' &&
                    styles.vehicleSelectedText,
                ]}
              >
                🚗 Car
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.vehicleButton,
                vehicleType === 'Bike' &&
                  styles.vehicleSelected,
              ]}
              onPress={() =>
                setVehicleType('Bike')
              }
            >
              <Text
                style={[
                  styles.vehicleText,
                  vehicleType === 'Bike' &&
                    styles.vehicleSelectedText,
                ]}
              >
                🏍️ Bike
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>
            Number Plate
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. LEA-1234"
            placeholderTextColor="#A99A8E"
            autoCapitalize="characters"
            value={numberPlate}
            onChangeText={setNumberPlate}
          />

          <Text style={styles.label}>
            Vehicle Model (Optional)
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Toyota Corolla"
            placeholderTextColor="#A99A8E"
            value={vehicleModel}
            onChangeText={setVehicleModel}
          />

          <Pressable
            style={styles.primaryButton}
            onPress={
              handleVehicleConfirm
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Continue
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // HOME SCREEN
  // =====================================================

  if (screen === 'home') {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Text
            style={styles.homeTitle}
          >
            Smart Parking Finder
          </Text>

          <Text
            style={styles.homeSubtitle}
          >
            Welcome to your parking
            dashboard
          </Text>

          {/* VEHICLE INFORMATION */}

          <View
            style={
              styles.vehicleInfoCard
            }
          >
            <Text
              style={
                styles.vehicleInfoText
              }
            >
              🚗 Vehicle:{' '}
              {vehicleType ||
                'Not Selected'}
            </Text>

            {numberPlate ? (
              <Text
                style={
                  styles.vehicleInfoText
                }
              >
                🔢 Number Plate:{' '}
                {numberPlate}
              </Text>
            ) : null}

            {vehicleModel ? (
              <Text
                style={
                  styles.vehicleInfoText
                }
              >
                🚘 Model:{' '}
                {vehicleModel}
              </Text>
            ) : null}
          </View>

          {/* GPS */}

          <View
            style={styles.locationCard}
          >
            <Text
              style={styles.locationTitle}
            >
              📍 Your Current Location
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={
                getCurrentLocation
              }
              disabled={locationLoading}
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {locationLoading
                  ? 'Getting Location...'
                  : 'Get My Location'}
              </Text>
            </Pressable>

            {latitude !== null &&
            longitude !== null ? (
              <View
                style={
                  styles.locationResult
                }
              >
                <Text
                  style={
                    styles.locationText
                  }
                >
                  Latitude: {latitude}
                </Text>

                <Text
                  style={
                    styles.locationText
                  }
                >
                  Longitude: {longitude}
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.locationHint
                }
              >
                Press the button to detect
                your current location.
              </Text>
            )}
          </View>

          {/* FIND PARKING */}

          <View
            style={styles.parkingCard}
          >
            <Text
              style={styles.parkingIcon}
            >
              🅿️
            </Text>

            <Text
              style={styles.parkingTitle}
            >
              Find Parking
            </Text>

            <Text
              style={styles.parkingText}
            >
              Search for available parking
              spaces near you.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() =>
                setScreen(
                  'parkingList',
                )
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Find Parking
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.secondaryButton
              }
              onPress={() =>
                setScreen(
                  'parkingMap',
                )
              }
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                🗺️ Open Parking Map
              </Text>
            </Pressable>
          </View>

          {/* MY BOOKINGS */}

          <Pressable
            style={
              styles.secondaryButton
            }
            onPress={() =>
              setScreen(
                'myBookings',
              )
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              📋 My Bookings
            </Text>
          </Pressable>

          {/* PROFILE */}

          <Pressable
            style={
              styles.secondaryButton
            }
            onPress={() =>
              setScreen('profile')
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              👤 Profile
            </Text>
          </Pressable>

          {/* HELP */}

          <Pressable
            style={
              styles.secondaryButton
            }
            onPress={() =>
              setScreen(
                'helpAbout',
              )
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              ℹ️ Help & About
            </Text>
          </Pressable>

          {/* LOGOUT */}

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text
              style={
                styles.logoutButtonText
              }
            >
              Logout
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // PARKING LIST
  // =====================================================

  if (screen === 'parkingList') {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Pressable
            onPress={() =>
              setScreen('home')
            }
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Nearby Parking
          </Text>

          <Text style={styles.subtitle}>
            Available parking spots near
            you
          </Text>

          <Pressable
            style={styles.mapButton}
            onPress={() =>
              setScreen('parkingMap')
            }
          >
            <Text
              style={styles.mapButtonText}
            >
              🗺️ View on Map
            </Text>
          </Pressable>

          {parkingSpots.map(spot => (
            <View
              key={spot.id}
              style={styles.spotCard}
            >
              <View
                style={
                  styles.spotHeaderRow
                }
              >
                <Text
                  style={styles.spotName}
                >
                  {spot.name}
                </Text>

                <View
                  style={[
                    styles.slotsBadge,
                    spot.availableSlots ===
                      0 &&
                      styles.slotsBadgeFull,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotsBadgeText,
                      spot.availableSlots ===
                        0 &&
                        styles.slotsBadgeTextFull,
                    ]}
                  >
                    {spot.availableSlots ===
                    0
                      ? 'Full'
                      : `${spot.availableSlots} slots`}
                  </Text>
                </View>
              </View>

              <Text
                style={styles.spotAddress}
              >
                📍 {spot.address}
              </Text>

              <Text
                style={styles.spotPrice}
              >
                💰 {spot.pricePerHour}
              </Text>

              <Pressable
                style={
                  styles.primaryButton
                }
                onPress={() =>
                  handleBookNow(
                    spot.name,
                    spot.availableSlots,
                    spot.address,
                    spot.pricePerHour,
                  )
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {spot.availableSlots === 0
                    ? 'Not Available'
                    : 'Book Now'}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MY BOOKINGS
  // =====================================================

  if (screen === 'myBookings') {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Pressable
            onPress={() =>
              setScreen('home')
            }
          >
            <Text style={styles.backText}>
              ← Back to Home
            </Text>
          </Pressable>

          <Text style={styles.title}>
            My Bookings
          </Text>

          <Text style={styles.subtitle}>
            View your parking bookings
          </Text>

          {bookedParking ? (
            <View
              style={
                styles.bookingCard
              }
            >
              <View
                style={
                  styles.bookingHeaderRow
                }
              >
                <Text
                  style={
                    styles.bookingParkingName
                  }
                >
                  {bookedParking}
                </Text>

                <Text
                  style={
                    styles.bookingStatus
                  }
                >
                  Confirmed
                </Text>
              </View>

              <Text
                style={
                  styles.bookingAddress
                }
              >
                📍{' '}
                {bookedParkingAddress ||
                  'No Address Available'}
              </Text>

              <View
                style={
                  styles.bookingDivider
                }
              />

              <Text
                style={
                  styles.bookingDetail
                }
              >
                🚗 Vehicle:{' '}
                {vehicleType || 'Car'}
              </Text>

              <Text
                style={
                  styles.bookingDetail
                }
              >
                🔢 Number Plate:{' '}
                {numberPlate ||
                  'Not Added'}
              </Text>

              <Text
                style={
                  styles.bookingDetail
                }
              >
                📅 Date:{' '}
                {bookedDate ||
                  'Not Available'}
              </Text>

              <Text
                style={
                  styles.bookingDetail
                }
              >
                ⏰ Time:{' '}
                {bookedTime ||
                  'Not Available'}
              </Text>

              <Text
                style={
                  styles.bookingDetail
                }
              >
                💰 Price:{' '}
                {bookedPrice ||
                  'Not Available'}
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.bookingInfoCard
              }
            >
              <Text
                style={
                  styles.bookingInfoText
                }
              >
                📋 No Booking Yet
              </Text>

              <Text
                style={
                  styles.bookingInfoText
                }
              >
                Book a parking spot from
                Parking List.
              </Text>
            </View>
          )}

          <View
            style={
              styles.bookingInfoCard
            }
          >
            <Text
              style={
                styles.bookingInfoText
              }
            >
              📋 Booking Information
            </Text>

            <Text
              style={
                styles.bookingInfoText
              }
            >
              Your latest parking booking
              is shown here.
            </Text>

            <Text
              style={
                styles.bookingInfoText
              }
            >
              Firebase booking storage will
              be connected later.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // PROFILE
  // =====================================================

  if (screen === 'profile') {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Pressable
            onPress={() =>
              setScreen('home')
            }
          >
            <Text style={styles.backText}>
              ← Back to Home
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Profile
          </Text>

          <Text style={styles.subtitle}>
            Your account information
          </Text>

          <View
            style={styles.profileCard}
          >
            <Text
              style={styles.profileIcon}
            >
              👤
            </Text>

            <Text
              style={styles.profileName}
            >
              {fullName ||
                'Smart Parking User'}
            </Text>

            <Text
              style={styles.profileEmail}
            >
              {email ||
                'No email available'}
            </Text>
          </View>

          <View
            style={
              styles.profileInfoCard
            }
          >
            <Text
              style={
                styles.profileInfoTitle
              }
            >
              Account Details
            </Text>

            <Text
              style={
                styles.profileInfoText
              }
            >
              👤 Name:{' '}
              {fullName || 'Not Added'}
            </Text>

            <Text
              style={
                styles.profileInfoText
              }
            >
              📧 Email:{' '}
              {email ||
                'Not Available'}
            </Text>

            <Text
              style={
                styles.profileInfoText
              }
            >
              🚗 Vehicle:{' '}
              {vehicleType ||
                'Not Selected'}
            </Text>

            <Text
              style={
                styles.profileInfoText
              }
            >
              🔢 Number Plate:{' '}
              {numberPlate ||
                'Not Added'}
            </Text>

            <Text
              style={
                styles.profileInfoText
              }
            >
              🚘 Model:{' '}
              {vehicleModel ||
                'Not Added'}
            </Text>
          </View>

          <Pressable
            style={
              styles.secondaryButton
            }
            onPress={() =>
              setScreen('myBookings')
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              📋 My Bookings
            </Text>
          </Pressable>

                    <Pressable
            style={
              styles.secondaryButton
            }
            onPress={handleTestNotification}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              🔔 Notifications
            </Text>
          </Pressable>

          <Pressable
            style={
              styles.secondaryButton
            }
            onPress={() =>
              setScreen(
                'helpAbout',
              )
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              ℹ️ Help & About
            </Text>
          </Pressable>

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text
              style={
                styles.logoutButtonText
              }
            >
              Logout
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // HELP & ABOUT
  // =====================================================

  if (screen === 'helpAbout') {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <Pressable
            onPress={() =>
              setScreen('home')
            }
          >
            <Text style={styles.backText}>
              ← Back to Home
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Help & About
          </Text>

          <Text style={styles.subtitle}>
            Smart Parking Finder
          </Text>

          <View
            style={styles.aboutCard}
          >
            <Text
              style={styles.aboutTitle}
            >
              Smart Parking Finder
            </Text>

            <Text
              style={styles.aboutVersion}
            >
              Version 1.0.0
            </Text>

            <Text
              style={styles.aboutText}
            >
              Smart Parking Finder helps
              users find nearby parking
              spaces quickly and easily.
            </Text>
          </View>

          <View
            style={styles.aboutCard}
          >
            <Text
              style={
                styles.aboutSectionTitle
              }
            >
              ❓ Frequently Asked Questions
            </Text>

            <Text
              style={styles.aboutQuestion}
            >
              How do I book parking?
            </Text>

            <Text
              style={styles.aboutText}
            >
              Open Parking List, select an
              available parking spot and
              press Book Now.
            </Text>

            <Text
              style={styles.aboutQuestion}
            >
              How does GPS work?
            </Text>

            <Text
              style={styles.aboutText}
            >
              Press Get My Location on the
              Home screen to detect your
              current location.
            </Text>

            <Text
              style={styles.aboutQuestion}
            >
              What happens if GPS is
              unavailable?
            </Text>

            <Text
              style={styles.aboutText}
            >
              The app uses a default Lahore
              location for demonstration
              purposes.
            </Text>

            <Text
              style={styles.aboutQuestion}
            >
              Where can I see my booking?
            </Text>

            <Text
              style={styles.aboutText}
            >
              Open My Bookings from the Home
              or Profile screen.
            </Text>
          </View>

          <View
            style={styles.aboutCard}
          >
            <Text
              style={
                styles.aboutSectionTitle
              }
            >
              📱 App Features
            </Text>

            <Text
              style={styles.aboutText}
            >
              • Firebase Authentication
            </Text>

            <Text
              style={styles.aboutText}
            >
              • Vehicle Confirmation
            </Text>

            <Text
              style={styles.aboutText}
            >
              • GPS Location
            </Text>

            <Text
              style={styles.aboutText}
            >
              • Parking List
            </Text>

            <Text
              style={styles.aboutText}
            >
              • Parking Map
            </Text>

            <Text
              style={styles.aboutText}
            >
              • Booking Confirmation
            </Text>

            <Text
              style={styles.aboutText}
            >
              • FCM Notifications
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =====================================================
  // PARKING MAP
  // =====================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.mapHeader}>
        <Pressable
          onPress={() =>
            setScreen('parkingList')
          }
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text
          style={styles.mapHeaderTitle}
        >
          Parking Map
        </Text>

        <View style={{width: 50}} />
      </View>

      <View style={styles.mapArea}>
        <View
          style={[
            styles.mapRoad,
            styles.mapRoadHorizontal,
          ]}
        />

        <View
          style={[
            styles.mapRoad,
            styles.mapRoadVertical,
          ]}
        />

        {parkingSpots.map(spot => (
          <Pressable
            key={spot.id}
            style={[
              styles.mapPin,
              {
                top: spot.mapTop,
                left: spot.mapLeft,
              },
            ]}
            onPress={() =>
              Alert.alert(
                spot.name,
                `${spot.address}\n${
                  spot.availableSlots ===
                  0
                    ? 'Currently Full'
                    : `${spot.availableSlots} slots available`
                }\n${spot.pricePerHour}`,
                [
                  {
                    text: 'Close',
                    style: 'cancel',
                  },
                  {
                    text: 'Book Now',
                    onPress: () =>
                      handleBookNow(
                        spot.name,
                        spot.availableSlots,
                        spot.address,
                        spot.pricePerHour,
                      ),
                  },
                ],
              )
            }
          >
            <Text
              style={[
                styles.mapPinIcon,
                spot.availableSlots ===
                  0 &&
                  styles.mapPinIconFull,
              ]}
            >
              📍
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.mapHint}>
        Tap a pin to see details and book
      </Text>
    </SafeAreaView>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFF4E8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  splashTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F28C28',
    textAlign: 'center',
    marginBottom: 12,
  },

  splashSubtitle: {
    fontSize: 16,
    color: '#6F6259',
    textAlign: 'center',
    marginBottom: 40,
  },

  container: {
    flex: 1,
    backgroundColor: '#FFF4E8',
  },

  scrollContent: {
    flexGrow: 1,
    padding: 25,
    paddingTop: 35,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#3D3027',
    marginTop: 20,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: '#6F6259',
    marginBottom: 30,
    lineHeight: 23,
  },

  backText: {
    fontSize: 16,
    color: '#F28C28',
    fontWeight: '600',
  },

  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F2D5BA',
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#3D3027',
    marginBottom: 10,
  },

  cardText: {
    fontSize: 15,
    color: '#6F6259',
    lineHeight: 22,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3D3027',
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2D5BA',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3D3027',
  },

  passwordContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2D5BA',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3D3027',
  },

  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  eyeIcon: {
    fontSize: 20,
  },

  primaryButton: {
    width: '100%',
    backgroundColor: '#F28C28',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 25,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  secondaryButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F28C28',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },

  secondaryButtonText: {
    color: '#F28C28',
    fontSize: 17,
    fontWeight: '700',
  },

  googleButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9CCC2',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },

  googleButtonText: {
    color: '#3D3027',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  normalText: {
    color: '#6F6259',
    fontSize: 15,
  },

  linkText: {
    color: '#F28C28',
    fontSize: 15,
    fontWeight: '700',
  },

  vehicleRow: {
    flexDirection: 'row',
    gap: 12,
  },

  vehicleButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2D5BA',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },

  vehicleSelected: {
    backgroundColor: '#F28C28',
    borderColor: '#F28C28',
  },

  vehicleText: {
    color: '#3D3027',
    fontSize: 16,
    fontWeight: '600',
  },

  vehicleSelectedText: {
    color: '#FFFFFF',
  },

  homeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3D3027',
    textAlign: 'center',
  },

  homeSubtitle: {
    fontSize: 16,
    color: '#6F6259',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },

  vehicleInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F2D5BA',
    alignItems: 'center',
  },

  vehicleInfoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3D3027',
    marginVertical: 3,
  },

  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F2D5BA',
  },

  locationTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#3D3027',
    marginBottom: 5,
  },

  locationResult: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#FFF4E8',
    borderRadius: 10,
  },

  locationText: {
    fontSize: 14,
    color: '#3D3027',
    marginVertical: 3,
  },

  locationHint: {
    fontSize: 14,
    color: '#6F6259',
    marginTop: 15,
    lineHeight: 20,
  },

  parkingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 25,
    borderWidth: 1,
    borderColor: '#F2D5BA',
  },

  parkingIcon: {
    fontSize: 45,
    textAlign: 'center',
    marginBottom: 10,
  },

  parkingTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#3D3027',
    textAlign: 'center',
    marginBottom: 10,
  },

  parkingText: {
    fontSize: 15,
    color: '#6F6259',
    textAlign: 'center',
    lineHeight: 22,
  },

  spotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F2D5BA',
  },

  spotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  spotName: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#3D3027',
    marginRight: 10,
  },

  spotAddress: {
    fontSize: 14,
    color: '#6F6259',
    marginTop: 12,
  },

  spotPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F28C28',
    marginTop: 10,
  },

  slotsBadge: {
    backgroundColor: '#E8F7ED',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  slotsBadgeFull: {
    backgroundColor: '#FDEAEA',
  },

  slotsBadgeText: {
    color: '#267A42',
    fontSize: 12,
    fontWeight: '700',
  },

  slotsBadgeTextFull: {
    color: '#B52B2B',
  },

  mapButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F28C28',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 20,
  },

  mapButtonText: {
    color: '#F28C28',
    fontSize: 16,
    fontWeight: '700',
  },

  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2D5BA',
    marginBottom: 20,
  },

  bookingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bookingParkingName: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#3D3027',
    marginRight: 10,
  },

  bookingStatus: {
    color: '#267A42',
    fontSize: 13,
    fontWeight: '700',
  },

  bookingAddress: {
    color: '#6F6259',
    fontSize: 14,
    marginTop: 12,
  },

  bookingDivider: {
    height: 1,
    backgroundColor: '#F2D5BA',
    marginVertical: 15,
  },

  bookingDetail: {
    fontSize: 15,
    color: '#3D3027',
    marginVertical: 5,
  },

  bookingInfoCard: {
    backgroundColor: '#FFF9F3',
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F2D5BA',
    marginBottom: 20,
  },

  bookingInfoText: {
    fontSize: 14,
    color: '#6F6259',
    lineHeight: 21,
    marginBottom: 7,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F2D5BA',
    marginBottom: 20,
  },

  profileIcon: {
    fontSize: 55,
    marginBottom: 10,
  },

  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3D3027',
  },

  profileEmail: {
    fontSize: 14,
    color: '#6F6259',
    marginTop: 5,
  },

  profileInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2D5BA',
    marginBottom: 10,
  },

  profileInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D3027',
    marginBottom: 12,
  },

  profileInfoText: {
    fontSize: 15,
    color: '#6F6259',
    marginVertical: 6,
  },

  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2D5BA',
    marginBottom: 18,
  },

  aboutTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3D3027',
    marginBottom: 5,
  },

  aboutVersion: {
    fontSize: 14,
    color: '#F28C28',
    fontWeight: '700',
    marginBottom: 15,
  },

  aboutSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D3027',
    marginBottom: 15,
  },

  aboutQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3D3027',
    marginTop: 12,
    marginBottom: 5,
  },

  aboutText: {
    fontSize: 14,
    color: '#6F6259',
    lineHeight: 21,
    marginBottom: 5,
  },

  logoutButton: {
    width: '100%',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#E4A0A0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },

  logoutButtonText: {
    color: '#B52B2B',
    fontSize: 17,
    fontWeight: '700',
  },

  mapHeader: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mapHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3D3027',
  },

  mapArea: {
    flex: 1,
    margin: 15,
    borderRadius: 20,
    backgroundColor: '#E9E3DC',
    overflow: 'hidden',
    position: 'relative',
  },

  mapRoad: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },

  mapRoadHorizontal: {
    left: 0,
    right: 0,
    top: '45%',
    height: 55,
  },

  mapRoadVertical: {
    top: 0,
    bottom: 0,
    left: '47%',
    width: 55,
  },

  mapPin: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  mapPinIcon: {
    fontSize: 25,
  },

  mapPinIconFull: {
    opacity: 0.45,
  },

  mapHint: {
    textAlign: 'center',
    color: '#6F6259',
    fontSize: 14,
    paddingBottom: 20,
  },
});

export default App;