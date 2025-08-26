export interface User {
  id: string;
  bookid: string;
  name: string;
  email?: string;
  phone: string;
  createdAt: Date;
  isAdmin: boolean;
  totalGrams: number;
  totalAmountSpent: number;
  monthsPaid: number;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  userBookid: string;
  userName: string;
  gramsPurchased: number;
  pricePerGram: number;
  totalAmount: number;
  transactionDate: Date;
  month: number;
  year: number;
}

export interface Price {
  id: string;
  goldPrice: number;
  silverPrice: number;
  updatedAt: Date;
  updatedBy: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (bookid: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}