import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy, 
  where,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User, Transaction, Price } from '@/types';
import { sendPriceUpdateNotification, sendTransactionNotification } from './notificationService';

// Price Services
export const getCurrentPrices = (): Promise<Price | null> => {
  return new Promise((resolve) => {
    const pricesRef = collection(db, 'prices');
    const q = query(pricesRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        resolve({
          id: doc.id,
          goldPrice: data.goldPrice,
          silverPrice: data.silverPrice,
          updatedAt: data.updatedAt.toDate(),
          updatedBy: data.updatedBy
        });
      } else {
        resolve(null);
      }
    });
  });
};

export const updatePrices = async (goldPrice: number, silverPrice: number, updatedBy: string): Promise<void> => {
  try {
    const pricesRef = collection(db, 'prices');
    await addDoc(pricesRef, {
      goldPrice,
      silverPrice,
      updatedAt: Timestamp.now(),
      updatedBy
    });
    
    // Send notification to all users about price update
    await sendPriceUpdateNotification(goldPrice, silverPrice);
  } catch (error) {
    console.error('Error updating prices:', error);
    throw error;
  }
};

// Transaction Services
export const createTransaction = async (
  userId: string,
  userBookid: string,
  userName: string,
  gramsPurchased: number,
  pricePerGram: number
): Promise<void> => {
  try {
    const totalAmount = gramsPurchased * pricePerGram;
    const now = new Date();
    
    // Add transaction
    const transactionRef = collection(db, 'transactions');
    await addDoc(transactionRef, {
      userId,
      userBookid,
      userName,
      gramsPurchased,
      pricePerGram,
      totalAmount,
      transactionDate: Timestamp.fromDate(now),
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
    
    // Update user stats
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
    
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      await updateDoc(userRef, {
        totalGrams: (userData.totalGrams || 0) + gramsPurchased,
        totalAmountSpent: (userData.totalAmountSpent || 0) + totalAmount,
        monthsPaid: userData.monthsPaid || 0 + 1
      });
    }
    
    // Send notification to admin about new transaction
    await sendTransactionNotification(userName, gramsPurchased, totalAmount);
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef, 
      where('userId', '==', userId),
      orderBy('transactionDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      transactionDate: doc.data().transactionDate.toDate()
    })) as Transaction[];
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return [];
  }
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, orderBy('transactionDate', 'desc'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      transactionDate: doc.data().transactionDate.toDate()
    })) as Transaction[];
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    return [];
  }
};

// User Services
export const createUser = async (userData: Partial<User>): Promise<void> => {
  try {
    const usersRef = collection(db, 'users');
    await addDoc(usersRef, {
      ...userData,
      createdAt: Timestamp.now(),
      totalGrams: 0,
      totalAmountSpent: 0,
      monthsPaid: 0,
      isActive: true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};