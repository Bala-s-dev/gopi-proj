import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Modal, Alert, TouchableOpacity, Animated } from 'react-native';
import { CustomButton } from '@/components/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { getAllUsers, createUser, deleteUser, getUserTransactions } from '@/services/firestoreService';
import { User, Transaction } from '@/types';
import { Trash2, Eye } from 'lucide-react-native';

export default function UsersScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [newUser, setNewUser] = useState({
    name: '',
    bookid: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const errorOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchUsers();
    }
  }, [currentUser]);

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
  const fetchUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers.filter(u => !u.isAdmin));
    } catch (error) {
      showMessage('Failed to fetch users');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.bookid || !newUser.phone) {
      showMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createUser({
        name: newUser.name,
        bookid: newUser.bookid,
        phone: newUser.phone,
        email: newUser.email,
        isAdmin: false,
      });
      
      showMessage('User created successfully', true);
      setModalVisible(false);
      setNewUser({ name: '', bookid: '', phone: '', email: '' });
      await fetchUsers();
    } catch (error) {
      showMessage('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              showMessage('User deleted successfully', true);
              await fetchUsers();
            } catch (error) {
              showMessage('Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    try {
      const transactions = await getUserTransactions(user.id);
      setUserTransactions(transactions);
    } catch (error) {
      showMessage('Failed to fetch user transactions');
      setUserTransactions([]);
    }
    setDetailsModalVisible(true);
  };

  if (!currentUser?.isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {errorVisible && (
        <Animated.View style={[
          styles.messagePopup, 
          { opacity: errorOpacity },
          isSuccess ? styles.successPopup : styles.errorPopup
        ]}>
          <Text style={styles.messageText}>{errorMessage}</Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Users Management</Text>
        <CustomButton
          title="Add User"
          onPress={() => setModalVisible(true)}
        />
      </View>

      <ScrollView style={styles.usersList}>
        {users.map((user) => (
          <View key={user.id} style={styles.userItem}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userBookId}>Book ID: {user.bookid}</Text>
              <Text style={styles.userStats}>
                {user.monthsPaid}/11 months • {user.totalGrams.toFixed(2)}g gold
              </Text>
            </View>
            <View style={styles.userActions}>
              <Text style={styles.totalSpent}>₹{user.totalAmountSpent.toFixed(2)}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleViewDetails(user)}
                >
                  <Eye size={16} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteUser(user.id, user.name)}
                >
                  <Trash2 size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New User</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#888"
              value={newUser.name}
              onChangeText={(text) => setNewUser({...newUser, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Book ID *"
              placeholderTextColor="#888"
              value={newUser.bookid}
              onChangeText={(text) => setNewUser({...newUser, bookid: text})}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              placeholderTextColor="#888"
              value={newUser.phone}
              onChangeText={(text) => setNewUser({...newUser, phone: text})}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              placeholderTextColor="#888"
              value={newUser.email}
              onChangeText={(text) => setNewUser({...newUser, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="secondary"
              />
              <View style={styles.buttonSpacer} />
              <CustomButton
                title="Create"
                onPress={handleCreateUser}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <Text style={styles.modalTitle}>User Details</Text>
            
            {selectedUser && (
              <>
                <View style={styles.userDetailSection}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedUser.name}</Text>
                </View>
                
                <View style={styles.userDetailSection}>
                  <Text style={styles.detailLabel}>Book ID:</Text>
                  <Text style={styles.detailValue}>{selectedUser.bookid}</Text>
                </View>
                
                <View style={styles.userDetailSection}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{selectedUser.phone}</Text>
                </View>
                
                {selectedUser.email && (
                  <View style={styles.userDetailSection}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedUser.email}</Text>
                  </View>
                )}
                
                <View style={styles.userDetailSection}>
                  <Text style={styles.detailLabel}>Total Gold:</Text>
                  <Text style={styles.detailValue}>{selectedUser.totalGrams.toFixed(2)}g</Text>
                </View>
                
                <View style={styles.userDetailSection}>
                  <Text style={styles.detailLabel}>Total Spent:</Text>
                  <Text style={styles.detailValue}>₹{selectedUser.totalAmountSpent.toFixed(2)}</Text>
                </View>
                
                <View style={styles.userDetailSection}>
                  <Text style={styles.detailLabel}>Months Paid:</Text>
                  <Text style={styles.detailValue}>{selectedUser.monthsPaid}/11</Text>
                </View>
                
                <View style={styles.userDetailSection}>
                  <Text style={styles.detailLabel}>Member Since:</Text>
                  <Text style={styles.detailValue}>{selectedUser.createdAt.toLocaleDateString()}</Text>
                </View>
                
                <Text style={styles.transactionsTitle}>Recent Transactions</Text>
                <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
                  {userTransactions.length > 0 ? (
                    userTransactions.map((transaction) => (
                      <View key={transaction.id} style={styles.transactionDetailItem}>
                        <View>
                          <Text style={styles.transactionDetailAmount}>
                            {transaction.gramsPurchased}g Gold
                          </Text>
                          <Text style={styles.transactionDetailDate}>
                            {transaction.transactionDate.toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={styles.transactionDetailPrice}>
                          ₹{transaction.totalAmount.toFixed(2)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noTransactionsText}>No transactions yet</Text>
                  )}
                </ScrollView>
              </>
            )}
            
            <CustomButton
              title="Close"
              onPress={() => setDetailsModalVisible(false)}
              variant="secondary"
            />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userBookId: {
    color: '#FFD700',
    fontSize: 14,
    marginBottom: 4,
  },
  userStats: {
    color: '#888',
    fontSize: 12,
  },
  userActions: {
    alignItems: 'flex-end',
  },
  totalSpent: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  deleteButton: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 100,
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
    marginBottom: 24,
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
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  buttonSpacer: {
    width: 12,
  },
  detailsModalContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  userDetailSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  transactionsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  transactionDetailItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDetailAmount: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionDetailDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  transactionDetailPrice: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noTransactionsText: {
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});