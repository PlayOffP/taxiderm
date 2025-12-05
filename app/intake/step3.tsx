import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { JobInsert } from '@/types/database';
import { ArrowLeft, ArrowRight, Package, DollarSign, FileText } from 'lucide-react-native';

const PROCESSING_TYPES = [
  { key: 'standard', label: 'Standard Processing', description: 'Basic meat processing and packaging' },
  { key: 'euro_mount', label: 'Euro Mount', description: 'Skull cleaning and mounting' },
  { key: 'shoulder_mount', label: 'Shoulder Mount', description: 'Traditional shoulder taxidermy' },
  { key: 'full_mount', label: 'Full Mount', description: 'Complete body taxidermy' },
  { key: 'processing_only', label: 'Processing Only', description: 'Meat processing without mounting' },
];

const CUT_SHEET_OPTIONS = [
  { key: 'steaks', label: 'Steaks', defaultValue: true },
  { key: 'roasts', label: 'Roasts', defaultValue: true },
  { key: 'ground_meat', label: 'Ground Meat', defaultValue: true },
  { key: 'sausage', label: 'Sausage', defaultValue: false },
  { key: 'jerky', label: 'Jerky', defaultValue: false },
  { key: 'backstrap', label: 'Backstrap Whole', defaultValue: true },
  { key: 'tenderloin', label: 'Tenderloin Whole', defaultValue: true },
];

export default function IntakeStep3Screen() {
  const { customerId, jobData } = useLocalSearchParams<{ 
    customerId: string; 
    jobData: string; 
  }>();
  
  const baseJob = JSON.parse(jobData) as Partial<JobInsert>;
  
  const [job, setJob] = useState<Partial<JobInsert>>({
    ...baseJob,
    processing_type: 'standard',
    cut_sheet: CUT_SHEET_OPTIONS.reduce((acc, option) => ({
      ...acc,
      [option.key]: option.defaultValue
    }), {}),
    instructions: '',
  });

  const handleCutSheetChange = (key: string, value: boolean) => {
    setJob({
      ...job,
      cut_sheet: {
        ...job.cut_sheet,
        [key]: value
      }
    });
  };

  const handleNext = () => {
    // Pass complete job data to final step
    router.push({
      pathname: '/intake/step4',
      params: { 
        customerId,
        jobData: JSON.stringify(job)
      }
    });
  };

  const formatProcessingType = (type: string) => {
    return PROCESSING_TYPES.find(t => t.key === type)?.label || type;
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
          <Text style={styles.headerSubtitle}>Step 3 of 4: Work Order</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={styles.progressStep} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Processing Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processing Type</Text>
          
          <View style={styles.processingOptions}>
            {PROCESSING_TYPES.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.processingCard,
                  job.processing_type === option.key && styles.processingCardSelected
                ]}
                onPress={() => setJob({ ...job, processing_type: option.key as any })}
              >
                <View style={styles.processingCardHeader}>
                  <Text style={[
                    styles.processingCardTitle,
                    job.processing_type === option.key && styles.processingCardTitleSelected
                  ]}>
                    {option.label}
                  </Text>
                  <View style={[
                    styles.radioButton,
                    job.processing_type === option.key && styles.radioButtonSelected
                  ]}>
                    {job.processing_type === option.key && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
                <Text style={[
                  styles.processingCardDescription,
                  job.processing_type === option.key && styles.processingCardDescriptionSelected
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cut Sheet (only for processing types) */}
        {['standard', 'processing_only'].includes(job.processing_type || '') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cut Sheet Preferences</Text>
            <Text style={styles.sectionSubtitle}>
              Select how you'd like the meat processed and packaged
            </Text>
            
            <View style={styles.cutSheetOptions}>
              {CUT_SHEET_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={styles.cutSheetOption}
                  onPress={() => handleCutSheetChange(option.key, !job.cut_sheet?.[option.key])}
                >
                  <View style={styles.cutSheetOptionContent}>
                    <Text style={styles.cutSheetOptionLabel}>{option.label}</Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    job.cut_sheet?.[option.key] && styles.checkboxSelected
                  ]}>
                    {job.cut_sheet?.[option.key] && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes (Optional)</Text>
            <View style={styles.textAreaContainer}>
              <FileText size={20} color="#6B7280" style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                value={job.instructions || ''}
                onChangeText={(text) => setJob({ ...job, instructions: text })}
                placeholder="Enter any special processing instructions, allergies, or preferences..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Package size={20} color="#059669" />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Processing Type</Text>
                <Text style={styles.summaryText}>{formatProcessingType(job.processing_type || '')}</Text>
              </View>
            </View>
            
            {['standard', 'processing_only'].includes(job.processing_type || '') && (
              <View style={styles.summaryRow}>
                <FileText size={20} color="#059669" />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>Cut Preferences</Text>
                  <Text style={styles.summaryText}>
                    {Object.entries(job.cut_sheet || {})
                      .filter(([_, selected]) => selected)
                      .map(([key, _]) => CUT_SHEET_OPTIONS.find(o => o.key === key)?.label)
                      .join(', ') || 'None selected'}
                  </Text>
                </View>
              </View>
            )}
            
            {job.instructions && (
              <View style={styles.summaryRow}>
                <FileText size={20} color="#059669" />
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>Special Instructions</Text>
                  <Text style={styles.summaryText}>{job.instructions}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next: Review & Sign</Text>
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  processingOptions: {
    gap: 12,
  },
  processingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  processingCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  processingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  processingCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  processingCardTitleSelected: {
    color: '#059669',
  },
  processingCardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  processingCardDescriptionSelected: {
    color: '#047857',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#059669',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  cutSheetOptions: {
    gap: 12,
  },
  cutSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cutSheetOptionContent: {
    flex: 1,
  },
  cutSheetOptionLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
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
  textAreaContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  textAreaIcon: {
    marginBottom: 8,
  },
  textArea: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    minHeight: 80,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
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
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});