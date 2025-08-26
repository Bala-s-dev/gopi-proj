# RM Jewellers - React Native App

A React Native application built with Expo for jewelry store gold investment plans.

## Features

### User Features
- Login with unique Book ID
- View current gold and silver prices
- Purchase gold in grams
- Track monthly payments (11-month plan)
- View purchase history and profile statistics

### Admin Features
- Update daily gold and silver prices
- Create new user accounts with unique Book IDs
- View all user transactions
- Monitor user statistics and payment progress
- Receive notifications for transactions

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication, Firestore, Cloud Messaging)
- **Navigation**: Expo Router with tab-based navigation
- **UI**: Custom components with premium design aesthetic

## Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Anonymous sign-in)
3. Create a Firestore database
4. Enable Cloud Messaging
5. Replace the Firebase configuration in `config/firebase.ts` with your project credentials

### 2. Firestore Database Structure

Create the following collections in Firestore:

#### users
```javascript
{
  bookid: string,
  name: string,
  email?: string,
  phone: string,
  isAdmin: boolean,
  totalGrams: number,
  totalAmountSpent: number,
  monthsPaid: number,
  isActive: boolean,
  createdAt: timestamp
}
```

#### transactions
```javascript
{
  userId: string,
  userBookid: string,
  userName: string,
  gramsPurchased: number,
  pricePerGram: number,
  totalAmount: number,
  transactionDate: timestamp,
  month: number,
  year: number
}
```

#### prices
```javascript
{
  goldPrice: number,
  silverPrice: number,
  updatedAt: timestamp,
  updatedBy: string
}
```

### 3. Initial Data Setup

Create an admin user in Firestore:
```javascript
{
  bookid: "ADMIN001",
  name: "Admin",
  email: "admin@rmjewellers.com",
  phone: "+1234567890",
  isAdmin: true,
  totalGrams: 0,
  totalAmountSpent: 0,
  monthsPaid: 0,
  isActive: true,
  createdAt: new Date()
}
```

Set initial prices:
```javascript
{
  goldPrice: 6000,
  silverPrice: 80,
  updatedAt: new Date(),
  updatedBy: "Admin"
}
```

### 4. Running the App

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

### Admin Login
- Use Book ID: `ADMIN001` to access admin features

### User Flow
1. Admin creates user with unique Book ID
2. User logs in with Book ID
3. User views current prices and purchases gold
4. System tracks monthly payments automatically

### Key Business Logic
- Users must make at least one transaction per month
- Plan duration: 11 months
- After completion, users can purchase equivalent gold/silver

## Security Features

- Firebase Authentication with anonymous sign-in
- Firestore security rules for data protection
- Book ID based access control
- Admin-only functions protection

## Future Enhancements

- Push notifications for transactions
- Payment gateway integration
- Advanced analytics dashboard
- Multi-language support
- Offline mode support