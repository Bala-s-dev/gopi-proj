import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriceCardProps {
  title: string;
  price: number;
  unit: string;
  icon: string;
}

export const PriceCard: React.FC<PriceCardProps> = ({ title, price, unit, icon }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.price}>₹{price.toFixed(2)}</Text>
      <Text style={styles.unit}>per {unit}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: 140,
    marginHorizontal: 8,
  },
  iconContainer: {
    backgroundColor: '#FFD700',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  price: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unit: {
    color: '#888',
    fontSize: 12,
  },
});