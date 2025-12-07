import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

export default function IntakeSuccessScreen() {
  const { invoiceNo } = useLocalSearchParams<{ invoiceNo: string }>();

  const handleGoHome = () => {
    router.dismissAll();
    router.replace('/(tabs)/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color="#059669" />
        </View>

        <Text style={styles.title}>Job Created Successfully!</Text>

        <Text style={styles.message}>
          Invoice <Text style={styles.invoiceNo}>#{invoiceNo}</Text> has been created.
        </Text>

        <Text style={styles.submessage}>
          Compliance documents are ready for printing.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGoHome}
        >
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  invoiceNo: {
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
  submessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#059669',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
});
