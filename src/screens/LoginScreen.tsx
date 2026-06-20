import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { getDBConnection } from '../database/db';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { Fingerprint } from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);

  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const checkBiometrics = async () => {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      if (available) {
        setBiometryType(biometryType ?? null);
        try {
          const { success } = await rnBiometrics.simplePrompt({ promptMessage: 'Authenticate to login' });
          if (success) {
            navigation.replace('Main');
          }
        } catch (error) {
          console.log('Initial biometrics failed', error);
        }
      }
    };
    checkBiometrics();
  }, [navigation]);

  const handleBiometricLogin = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    try {
      const { success } = await rnBiometrics.simplePrompt({ promptMessage: 'Authenticate to login' });
      if (success) {
        navigation.replace('Main');
      }
    } catch (error) {
      console.log('Biometrics failed', error);
      Alert.alert('Authentication Failed', 'Could not authenticate with biometrics.');
    }
  };

  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both User ID and Password.');
      return;
    }

    setLoading(true);

    try {
      const db = await getDBConnection();
      const query = `SELECT * FROM superadmin WHERE user_id = ? AND password = ?`;
      const [results] = await db.executeSql(query, [userId, password]);

      if (results.rows.length > 0) {
        navigation.replace('Main');
      } else {
        Alert.alert('Error', 'Invalid User ID or Password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Super Admin Login</Text>
        <Text style={styles.subtitle}>Sign in to manage SMJ Sales</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>User ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter User ID"
            placeholderTextColor="#888888"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Password"
            placeholderTextColor="#888888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {biometryType && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
          >
            <Fingerprint size={24} color="#3498DB" style={{ marginRight: 8 }} />
            <Text style={styles.biometricButtonText}>Login with Biometrics</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C3E50',
  },
  button: {
    backgroundColor: '#3498DB',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#E8F8F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1F2EB',
  },
  biometricButtonText: {
    color: '#3498DB',
    fontSize: 16,
    fontWeight: '600',
  },
});
