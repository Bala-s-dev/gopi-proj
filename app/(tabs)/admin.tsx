import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Animated } from 'react-native';
import * as Notifications from 'expo-notifications';
import { CustomButton } from '@/components/CustomButton';
import { StatsCard } from '@/components/StatsCard';
import { useAuth } from '@/context/AuthContext';
import { updatePrices, getCurrentPrices, getAllTransactions } from '@/services/firestoreService';
import { requestNotificationPermissions } from '@/services/notificationService';
import { Price, Transaction } from '@/types';

export default function AdminScreen() {
  const { user } = useAuth();
  const [goldPrice, setGoldPrice] = useState('');
  const [silverPrice, setSilverPrice] = useState('');
  const [currentPrices, setCurrentPrices] = useState<Price | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const errorOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (user?.isAdmin) {
      fetchCurrentPrices();
      fetchTransactions();
      setupAdminNotifications();
    }
  }, [user]);

  const showMessage = (message: string, success: boolean = false) => {
    setErrorMessage(message);
    setIsSuccess(success);
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
  const setupAdminNotifications = async () => {
    await requestNotificationPermissions();
    
    // Listen for transaction notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      if (title?.includes('New Transaction')) {
        showMessage(`${title}: ${body}`, true);
        fetchTransactions(); // Refresh transactions when notification received
      }
    });

    return () => subscription.remove();
  };

  const fetchCurrentPrices = async () => {
    try {
      const prices = await getCurrentPrices();
      setCurrentPrices(prices);
      if (prices) {
        setGoldPrice(prices.goldPrice.toString());
        setSilverPrice(prices.silverPrice.toString());
      }
    } catch (error) {
      showMessage('Failed to fetch current prices');
    }
  };

  const fetchTransactions = async () => {
    try {
      const allTransactions = await getAllTransactions();
      setTransactions(allTransactions);
    } catch (error) {
      showMessage('Failed to fetch transactions');
    }
  };

  const handleUpdatePrices = async () => {
    if (!goldPrice || !silverPrice) {
      showMessage('Please enter both gold and silver prices');
      return;
    }

    const goldPriceNum = parseFloat(goldPrice);
    const silverPriceNum = parseFloat(silverPrice);

    if (isNaN(goldPriceNum) || isNaN(silverPriceNum)) {
      showMessage('Please enter valid price numbers');
      return;
    }

    setLoading(true);
    try {
      await updatePrices(goldPriceNum, silverPriceNum, user?.name || 'Admin');
      showMessage('Prices updated successfully', true);
      await fetchCurrentPrices();
    } catch (error) {
      showMessage('Failed to update prices');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied</Text>
      </View>
    );
  }

  const todayTransactions = transactions.filter(t => {
    const today = new Date();
    const transactionDate = new Date(t.transactionDate);
    return transactionDate.toDateString() === today.toDateString();
  });

  return (
    <ScrollView style={styles.container}>
      {errorVisible && (
        <Animated.View style={[
          styles.messagePopup, 
          { opacity: errorOpacity },
          isSuccess ? styles.successPopup : styles.errorPopup
        ]}>
          <Text style={styles.messageText}>{errorMessage}</Text>
        </Animated.View>
      )}

      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={styles.statsContainer}>
        <StatsCard
          title="Today's Transactions"
          value={todayTransactions.length}
        />
        <StatsCard
          title="Total Revenue Today"
          value={`₹${todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2)}`}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Prices</Text>
        <View style={styles.priceInputs}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gold Price (₹/gram)</Text>
            <TextInput
              style={styles.input}
              value={goldPrice}
              onChangeText={setGoldPrice}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#888"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Silver Price (₹/gram)</Text>
            <TextInput
              style={styles.input}
              value={silverPrice}
              onChangeText={setSilverPrice}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#888"
            />
          </View>
        </View>
        <CustomButton
          title="Update Prices"
          onPress={handleUpdatePrices}
          loading={loading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Prices</Text>
        {currentPrices ? (
          <View style={styles.currentPrices}>
            <Text style={styles.priceText}>
              Gold: ₹{currentPrices.goldPrice.toFixed(2)}/gram
            </Text>
            <Text style={styles.priceText}>
              Silver: ₹{currentPrices.silverPrice.toFixed(2)}/gram
            </Text>
            <Text style={styles.updateText}>
              Last updated: {currentPrices.updatedAt.toLocaleString()}
            </Text>
          </View>
        ) : (
          <Text style={styles.noPrices}>No prices set</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.slice(0, 10).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View>
              <Text style={styles.transactionUser}>
                {transaction.userName} ({transaction.userBookid})
              </Text>
              <Text style={styles.transactionDetails}>
                {transaction.gramsPurchased}g @ ₹{transaction.pricePerGram}/gram
              </Text>
              <Text style={styles.transactionDate}>
                {transaction.transactionDate.toLocaleString()}
              </Text>
            </View>
            <Text style={styles.transactionAmount}>
              ₹{transaction.totalAmount.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 60,
  },
  messagePopup: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 8,
    padding: 16,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  errorPopup: {
    backgroundColor: '#ff4444',
  },
  successPopup: {
    backgroundColor: '#4CAF50',
  },
  messageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  priceInputs: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
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
  currentPrices: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 16,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 4,
  },
  updateText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  noPrices: {
    color: '#888',
    textAlign: 'center',
  },
  transactionItem: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionUser: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDetails: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  transactionDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 100,
  },
});