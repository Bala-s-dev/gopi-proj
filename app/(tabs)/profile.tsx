import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { StatsCard } from '@/components/StatsCard';
import { CustomButton } from '@/components/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { getUserTransactions } from '@/services/firestoreService';
import { Transaction } from '@/types';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const userTransactions = await getUserTransactions(user.id);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (!user) return null;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Book ID: {user.bookid}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatsCard
          title="Months Paid"
          value={`${user.monthsPaid}/11`}
        />
        <StatsCard
          title="Total Grams"
          value={user.totalGrams}
          subtitle="gold purchased"
        />
      </View>

      <View style={styles.statsContainer}>
        <StatsCard
          title="Total Spent"
          value={`₹${user.totalAmountSpent}`}
        />
        <StatsCard
          title="Remaining"
          value={`${11 - user.monthsPaid} months`}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View>
                <Text style={styles.transactionAmount}>
                  {transaction.gramsPurchased}g Gold
                </Text>
                <Text style={styles.transactionDate}>
                  {transaction.transactionDate.toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.transactionPrice}>
                ₹{transaction.totalAmount.toFixed(2)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noTransactions}>No transactions yet</Text>
        )}
      </View>

      <View style={styles.actions}>
        <CustomButton
          title="Sign Out"
          onPress={handleSignOut}
          variant="secondary"
        />
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
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  transactionAmount: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  transactionPrice: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noTransactions: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  actions: {
    marginTop: 20,
    marginBottom: 40,
  },
});