import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, ArrowRight } from 'lucide-react-native';

export default function IntakeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New Job</Text>
        <Text style={styles.subtitle}>Start a new intake process</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.newJobCard}
          onPress={() => router.push('/intake/step1')}
        >
          <View style={styles.cardIcon}>
            <Plus size={32} color="white" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>New Animal Intake</Text>
            <Text style={styles.cardDescription}>
              Start the 4-step intake process to create job and generate compliance documents
            </Text>
            <View style={styles.cardSteps}>
              <Text style={styles.stepText}>1. Customer Info</Text>
              <Text style={styles.stepText}>2. Animal & Legal</Text>
              <Text style={styles.stepText}>3. Work Order</Text>
              <Text style={styles.stepText}>4. Review & Sign</Text>
            </View>
          </View>
          <ArrowRight size={24} color="#059669" />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Intake Process</Text>
          <Text style={styles.infoText}>
            The intake process captures all required information once and automatically 
            generates both PWD-535 and Wildlife Resource Document with auto-print capability.
          </Text>
          <Text style={styles.infoText}>
            • One PWD-535 per animal{'\n'}
            • Legal compliance validation{'\n'}
            • Digital signature capture{'\n'}
            • Automatic document generation{'\n'}
            • AirPrint integration
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  newJobCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardSteps: {
    gap: 2,
  },
  stepText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#059669',
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0EA5E9',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
    lineHeight: 20,
    marginBottom: 8,
  },
});