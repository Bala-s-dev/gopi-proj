import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, Modal, TouchableOpacity, Animated } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PriceCard } from '@/components/PriceCard';
import { CustomButton } from '@/components/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { getCurrentPrices, createTransaction } from '@/services/firestoreService';
import { requestNotificationPermissions } from '@/services/notificationService';
import { Price } from '@/types';
import { TrendingUp, Coins } from 'lucide-react-native';

export default function HomeScreen() {
  const [prices, setPrices] = useState<Price | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rupeesToBuy, setRupeesToBuy] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorOpacity = useState(new Animated.Value(0))[0];
  const { user, fetchUserData} = useAuth();
  useEffect(() => {
    fetchPrices();
    setupNotifications();
  }, []);

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
    }, 3000);
  };

  const setupNotifications = async () => {
    await requestNotificationPermissions();
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      if (title?.includes('Price Update')) {
        showError(`${title}: ${body}`);
        fetchPrices();
      }
    });
    return () => subscription.remove();
  };

  const fetchPrices = async () => {
    try {
      const currentPrices = await getCurrentPrices();
      setPrices(currentPrices);
    } catch (error) {
      showError('Failed to fetch current prices. Please try again.');
    }
  };

  const handleBuyGold = async () => {
    if (!rupeesToBuy || isNaN(parseFloat(rupeesToBuy))) {
      showError('Please enter a valid amount in rupees');
      return;
    }
    if (!prices || !user) {
      showError('Unable to process transaction. Please try again.');
      return;
    }
    const rupees = parseFloat(rupeesToBuy);
    const grams = rupees / prices.goldPrice;

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${grams.toFixed(4)}g of gold for ₹${rupees.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => processPurchase(grams, rupees) }
      ]
    );
    await fetchPrices();
  };

  const processPurchase = async (grams: number, rupees: number) => {
    if (!user || !prices) return;

    setLoading(true);
    try {
      await createTransaction(
        user.id,
        user.bookid,
        user.name,
        grams,
        prices.goldPrice
      );
      showError('Gold purchased successfully!');
      setModalVisible(false);
      setRupeesToBuy('');
      await fetchPrices();
      await fetchUserData(user.id);
    } catch (error) {
      showError('Failed to process transaction. Please try again.');
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

      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Coins size={32} color="#FFD700" />
        </View>
      </View>

      <View style={styles.pricesHeader}>
        <TrendingUp size={20} color="#FFD700" />
        <Text style={styles.pricesTitle}>Today's Market Prices</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pricesContainer}>
        {prices ? (
          <>
            <PriceCard
              title="Gold"
              price={prices.goldPrice}
              unit="gram"
              icon="🥇"
            />
            <PriceCard
              title="Silver"
              price={prices.silverPrice}
              unit="gram"
              icon="🥈"
            />
          </>
        ) : (
          <Text style={styles.loadingText}>Loading prices...</Text>
        )}
      </ScrollView>

      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.totalGrams.toFixed(2)}g</Text>
          <Text style={styles.statLabel}>Gold Owned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.monthsPaid}/11</Text>
          <Text style={styles.statLabel}>Months Paid</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{user?.totalAmountSpent.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.buyButton, !prices && styles.buyButtonDisabled]}
        onPress={() => setModalVisible(true)}
        disabled={!prices}
      >
        <View style={styles.buyButtonContent}>
          <Coins size={24} color="#1a1a1a" />
          <Text style={styles.buyButtonText}>Purchase Gold</Text>
        </View>
        <Text style={styles.buyButtonSubtext}>Invest in your future</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buy Gold</Text>
            <Text style={styles.modalSubtitle}>
              Current price: ₹{prices?.goldPrice.toFixed(2)} per gram
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter amount in rupees"
              placeholderTextColor="#888"
              value={rupeesToBuy}
              onChangeText={setRupeesToBuy}
              keyboardType="numeric"
            />

            {rupeesToBuy && prices && (
              <Text style={styles.totalAmount}>
                You will get: {(parseFloat(rupeesToBuy) / prices.goldPrice).toFixed(4)}g
              </Text>
            )}

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="secondary"
              />
              <View style={styles.buttonSpacer} />
              <CustomButton
                title="Buy"
                onPress={handleBuyGold}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 60,
  },
  errorPopup: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcome: {
    color: '#888',
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerIcon: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 12,
  },
  pricesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pricesTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  pricesContainer: {
    marginBottom: 32,
  },
  quickStats: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#444',
    marginHorizontal: 16,
  },
  buyButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  buyButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
  },
  buyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  buyButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buyButtonSubtext: {
    color: '#1a1a1a',
    fontSize: 14,
    opacity: 0.7,
  },
  loadingText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  actionContainer: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  totalAmount: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  buttonSpacer: {
    width: 12,
  },
});