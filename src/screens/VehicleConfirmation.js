import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

// Template images exported from Canva (your car.png and bike.png are kept untouched)
const carImg = require('../../assets/images/car.png');
const bikeImg = require('../../assets/images/bike.png');
const numberPlateImg = require('../../assets/images/number_plate.png');
const carSymbolImg = require('../../assets/images/car_symbol.png');

const VEHICLES = [
  { key: 'car', label: 'Car', image: carImg },
  { key: 'bike', label: 'Bike', image: bikeImg },
];

export default function VehicleConfirmation() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [numberPlate, setNumberPlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  if (!fontsLoaded) {
    return null;
  }

  const handleNext = () => {
    if (!numberPlate.trim()) {
      Alert.alert('Missing details', 'Please enter your vehicle number plate');
      return;
    }
    Alert.alert('Vehicle confirmed', 'Your vehicle details have been saved');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Confirmation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>Select your vehicle type</Text>

        {/* Vehicle cards (stacked vertically, like the design) */}
        {VEHICLES.map((vehicle) => {
          const selected = selectedVehicle === vehicle.key;
          return (
            <TouchableOpacity
              key={vehicle.key}
              style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
              onPress={() => setSelectedVehicle(vehicle.key)}
              activeOpacity={0.8}
            >
              <View style={styles.imageBox}>
                <Image
                  source={vehicle.image}
                  style={styles.vehicleImage}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={[
                  styles.vehicleLabel,
                  selected && styles.vehicleLabelSelected,
                ]}
              >
                {vehicle.label}
              </Text>

              {selected && (
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Number plate */}
        <Text style={styles.label}>Vehicle Number Plate</Text>
        <View style={styles.inputWrapper}>
          <Image source={numberPlateImg} style={styles.inputIcon} resizeMode="contain" />
          <TextInput
            style={styles.input}
            placeholder="e.g. LEA-1234"
            placeholderTextColor="#94A3B8"
            value={numberPlate}
            onChangeText={setNumberPlate}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {/* Vehicle model */}
        <Text style={styles.label}>Vehicle Model (Optional)</Text>
        <View style={styles.inputWrapper}>
          <Image source={carSymbolImg} style={styles.inputIcon} resizeMode="contain" />
          <TextInput
            style={styles.input}
            placeholder="e.g. Toyota Corolla"
            placeholderTextColor="#94A3B8"
            value={vehicleModel}
            onChangeText={setVehicleModel}
            autoCorrect={false}
          />
        </View>
      </ScrollView>

      {/* Fixed Next button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f4f7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 37,
    paddingBottom: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: '#0F172A',
  },
  headerSpacer: {
    width: 40,
  },

  // Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },

  // Vehicle cards
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  vehicleCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EEF4FF',
  },
  imageBox: {
    width: 110,
    height: 66,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImage: {
    width: 107,
    height: 66,
  },
  vehicleLabel: {
    flex: 1,
    marginLeft: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: '#334155',
  },
  vehicleLabelSelected: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1D4ED8',
  },
  checkCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Inputs
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 18,
  },
  inputIcon: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 200,
    paddingTop: 14,
    backgroundColor: '#f1f4f7',
  },
  nextButton: {
    backgroundColor: '#1D4ED8',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});