import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { JobInsert } from '@/types/database';
import { ArrowLeft, ArrowRight, Calendar, FileText, MapPin } from 'lucide-react-native';

const SPECIES_OPTIONS = [
  { key: 'deer', label: 'Deer' },
  { key: 'turkey', label: 'Turkey' },
  { key: 'pronghorn', label: 'Pronghorn' },
  { key: 'pheasant', label: 'Pheasant' },
  { key: 'duck', label: 'Duck' },
  { key: 'quail', label: 'Quail' },
  { key: 'dove', label: 'Dove' },
  { key: 'other', label: 'Other' },
];

const SEX_OPTIONS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'unknown', label: 'Unknown' },
];

export default function IntakeStep2Screen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const [job, setJob] = useState<Partial<JobInsert>>({
    customer_id: customerId,
    species: 'deer',
    sex: 'male',
    date_killed: new Date().toISOString().split('T')[0],
    license_no: '',
    ranch_area: '',
    county: '',
    state: 'TX',
    antler_points: undefined,
    beard_attached: undefined,
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!job.species) {
      Alert.alert('Validation Error', 'Species is required');
      return false;
    }
    if (!job.sex) {
      Alert.alert('Validation Error', 'Sex is required');
      return false;
    }
    if (!job.date_killed) {
      Alert.alert('Validation Error', 'Date killed is required');
      return false;
    }
    if (!job.license_no?.trim()) {
      Alert.alert('Validation Error', 'License/Confirmation number is required');
      return false;
    }
    
    // Species-specific validation
    if (job.species === 'deer' && job.sex === 'male' && !job.antler_points) {
      Alert.alert('Validation Error', 'Antler points are required for male deer');
      return false;
    }
    if (job.species === 'turkey' && job.sex === 'male' && job.beard_attached === undefined) {
      Alert.alert('Validation Error', 'Beard attachment status is required for male turkey');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    
    // Pass job data to next step
    router.push({
      pathname: '/intake/step3',
      params: { 
        customerId,
        jobData: JSON.stringify(job)
      }
    });
  };

  const formatSpecies = (species: string) => {
    return species.charAt(0).toUpperCase() + species.slice(1);
  };

  const formatSex = (sex: string) => {
    return sex.charAt(0).toUpperCase() + sex.slice(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>New Job Intake</Text>
          <Text style={styles.headerSubtitle}>Step 2 of 4: Animal & Legal Information</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={styles.progressStep} />
        <View style={styles.progressStep} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Species Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Species *</Text>
            <View style={styles.optionsGrid}>
              {SPECIES_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionButton,
                    job.species === option.key && styles.optionButtonSelected
                  ]}
                  onPress={() => setJob({ ...job, species: option.key as any })}
                >
                  <Text style={[
                    styles.optionText,
                    job.species === option.key && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sex *</Text>
            <View style={styles.optionsRow}>
              {SEX_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionButton,
                    job.sex === option.key && styles.optionButtonSelected,
                    { flex: 1 }
                  ]}
                  onPress={() => setJob({ ...job, sex: option.key as any })}
                >
                  <Text style={[
                    styles.optionText,
                    job.sex === option.key && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Species-specific fields */}
          {job.species === 'deer' && job.sex === 'male' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Antler Points *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={job.antler_points?.toString() || ''}
                  onChangeText={(text) => setJob({ ...job, antler_points: parseInt(text) || undefined })}
                  placeholder="Enter number of points"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {job.species === 'turkey' && job.sex === 'male' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Beard Attached *</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Beard is attached</Text>
                <Switch
                  value={job.beard_attached || false}
                  onValueChange={(value) => setJob({ ...job, beard_attached: value })}
                  trackColor={{ false: '#E5E7EB', true: '#D1FAE5' }}
                  thumbColor={job.beard_attached ? '#059669' : '#9CA3AF'}
                />
              </View>
            </View>
          )}
        </View>

        {/* Legal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date Killed *</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={job.date_killed}
                onChangeText={(text) => setJob({ ...job, date_killed: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License/Confirmation Number *</Text>
            <View style={styles.inputContainer}>
              <FileText size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={job.license_no}
                onChangeText={(text) => setJob({ ...job, license_no: text })}
                placeholder="Enter license or confirmation number"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ranch/Hunting Area (Optional)</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={job.ranch_area || ''}
                onChangeText={(text) => setJob({ ...job, ranch_area: text })}
                placeholder="Enter ranch or hunting area name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.addressRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>County</Text>
              <TextInput
                style={styles.input}
                value={job.county || ''}
                onChangeText={(text) => setJob({ ...job, county: text })}
                placeholder="County"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, { width: 80 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={job.state || 'TX'}
                onChangeText={(text) => setJob({ ...job, state: text })}
                placeholder="TX"
                placeholderTextColor="#9CA3AF"
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {formatSpecies(job.species || '')} • {formatSex(job.sex || '')}
              {job.species === 'deer' && job.sex === 'male' && job.antler_points && 
                ` • ${job.antler_points} points`}
              {job.species === 'turkey' && job.sex === 'male' && job.beard_attached !== undefined && 
                ` • Beard ${job.beard_attached ? 'attached' : 'not attached'}`}
            </Text>
            <Text style={styles.summarySubtext}>
              Killed: {job.date_killed} • License: {job.license_no}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>Next: Work Order</Text>
          <ArrowRight size={20} color="white" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#059669',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  optionTextSelected: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});