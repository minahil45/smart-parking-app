import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDiHcYx6Mj7y2V3a3eQOUlJkr1gNPNFn-g',
  authDomain: 'smartparkingfinder-fe925.firebaseapp.com',
  projectId: 'smartparkingfinder-fe925',
  storageBucket: 'smartparkingfinder-fe925.firebasestorage.app',
  messagingSenderId: '983774749382',
  appId: '1:983774749382:web:cf11f23ce21f6ce76dedc7',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // App reload par already initialized ho to ye chalta hai
  auth = getAuth(app);
}

export { auth };