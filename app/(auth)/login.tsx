import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { CustomButton } from '@/components/CustomButton';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [bookid, setBookid] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorOpacity = useState(new Animated.Value(0))[0];
  const { signIn } = useAuth();
  const router = useRouter();

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorVisible(true);
    Animated.timing(errorOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(errorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setErrorVisible(false);
      });
    }, 4000);
  };
  const handleLogin = async () => {
    if (!bookid.trim()) {
      showError('Please enter your Book ID');
      return;
    }

    setLoading(true);
    try {
      const success = await signIn(bookid.trim());
      if (success) {
        router.replace('/(tabs)');
      } else {
        showError('Invalid Book ID or inactive account');
      }
    } catch (error) {
      showError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {errorVisible && (
        <Animated.View style={[styles.errorPopup, { opacity: errorOpacity }]}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </Animated.View>
      )}

      <View style={styles.content}>
        <Text style={styles.logo}>RM Jewellers</Text>
        <Text style={styles.subtitle}>Enter your Book ID to continue</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Book ID"
            placeholderTextColor="#888"
            value={bookid}
            onChangeText={setBookid}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <CustomButton
          title="Login"
          onPress={handleLogin}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  errorPopup: {
    position: 'absolute',
    top: 100,
    left: 24,
    right: 24,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 16,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#2d2d2d',
    color: '#ffffff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
});