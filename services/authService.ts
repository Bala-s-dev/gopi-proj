import { auth, db } from '@/config/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '@/types';

export const authenticateWithBookId = async (bookid: string): Promise<User | null> => {
  try {
    // Sign in anonymously to Firebase Auth
    await signInAnonymously(auth);
    
    // Query user by bookid
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('bookid', '==', bookid), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Invalid bookid or inactive account');
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    return {
      id: userDoc.id,
      bookid: userData.bookid,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      createdAt: userData.createdAt.toDate(),
      isAdmin: userData.isAdmin || false,
      totalGrams: userData.totalGrams || 0,
      totalAmountSpent: userData.totalAmountSpent || 0,
      monthsPaid: userData.monthsPaid || 0,
      isActive: userData.isActive
    } as User;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};