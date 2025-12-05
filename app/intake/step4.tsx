import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { JobInsert, CustomerRow } from '@/types/database';
import { ArrowLeft, Check, FileText, User, Calendar, Package, Printer } from 'lucide-react-native';

export default function IntakeStep4Screen() {
  const { customerId, jobData } = useLocalSearchParams<{ 
    customerId: string; 
    jobData: string; 
  }>();
  
  const job = JSON.parse(jobData) as Partial<JobInsert>;
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (error) {
      console.error('Error loading customer:', error);
      Alert.alert('Error', 'Failed to load customer information');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-4);
    return `${year}${month}${day}-${time}`;
  };

  const handleSubmit = async () => {
    if (!customer) {
      Alert.alert('Error', 'Customer information not loaded');
      return;
    }

    try {
      setSubmitting(true);

      // Generate invoice number
      const invoiceNo = generateInvoiceNumber();

      // Create the job
      const { data: newJob, error: jobError } = await supabase
        .from('job')
        .insert([{
          customer_id: customerId,
          species: job.species,
          sex: job.sex,
          antler_points: job.antler_points,
          beard_attached: job.beard_attached,
          date_killed: job.date_killed,
          license_no: job.license_no,
          ranch_area: job.ranch_area,
          county: job.county,
          state: job.state,
          processing_type: job.processing_type,
          cut_sheet: job.cut_sheet || {},
          instructions: job.instructions,
          invoice_no: invoiceNo,
          status: 'received',
        }])
        .select()
        .single();

      if (jobError) throw jobError;

      // Create compliance documents
      const compliancePromises = [
        // PWD-535 document
        supabase.from('compliance_doc').insert([{
          job_id: newJob.id,
          type: 'PWD-535',
          printed: false,
        }]),
        // Wildlife Resource Document
        supabase.from('compliance_doc').insert([{
          job_id: newJob.id,
          type: 'WRD',
          printed: false,
        }])
      ];

      const complianceResults = await Promise.all(compliancePromises);
      
      // Check for compliance document errors
      complianceResults.forEach((result, index) => {
        if (result.error) {
          console.error(`Compliance document ${index} error:`, result.error);
        }
      });

      // Create audit log entry
      const { error: auditError } = await supabase.from('audit_log').insert([{
        job_id: newJob.id,
        actor: 'System',
        action: 'job_created',
        meta: {
          invoice_no: invoiceNo,
          customer_name: customer.name,
          species: job.species,
          processing_type: job.processing_type,
        }
      }]);
      
      if (auditError) {
        console.error('Audit log error:', auditError);
      }

      Alert.alert(
        'Job Created Successfully!',
        `Invoice #${invoiceNo} has been created. Compliance documents are ready for printing.`,
        [
          {
            text: 'Go to Home',
            onPress: () => {
              router.dismissAll();
              router.replace('/(tabs)/');
            }
          },
          {
            text: 'Create Another',
            onPress: () => {
              router.dismissAll();
              router.replace('/(tabs)/intake');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Error', `Failed to create job: ${error.message || 'Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatSpecies = (species: string) => {
    return species.charAt(0).toUpperCase() + species.slice(1);
  };

  const formatSex = (sex: string) => {
    return sex.charAt(0).toUpperCase() + sex.slice(1);
  };

  const formatProcessingType = (type: string) => {
    const types: Record<string, string> = {
      standard: 'Standard Processing',
      euro_mount: 'Euro Mount',
      shoulder_mount: 'Shoulder Mount',
      full_mount: 'Full Mount',
      processing_only: 'Processing Only',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerSubtitle}>Step 4 of 4: Review & Submit</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={[styles.progressStep, styles.progressStepActive]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Customer Information</Text>
          </View>
          
          <View style={styles.reviewCard}>
            <Text style={styles.reviewLabel}>Name</Text>
            <Text style={styles.reviewValue}>{customer?.name}</Text>
            
            <Text style={styles.reviewLabel}>Phone</Text>
            <Text style={styles.reviewValue}>{customer?.phone}</Text>
            
            {customer?.email && (
              <>
                <Text style={styles.reviewLabel}>Email</Text>
                <Text style={styles.reviewValue}>{customer.email}</Text>
              </>
            )}
            
            <Text style={styles.reviewLabel}>SMS Notifications</Text>
            <Text style={styles.reviewValue}>
              {customer?.sms_opt_in ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>

        {/* Animal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Animal & Legal Information</Text>
          </View>
          
          <View style={styles.reviewCard}>
            <Text style={styles.reviewLabel}>Species & Sex</Text>
            <Text style={styles.reviewValue}>
              {formatSpecies(job.species || '')} • {formatSex(job.sex || '')}
              {job.species === 'deer' && job.sex === 'male' && job.antler_points && 
                ` • ${job.antler_points} points`}
              {job.species === 'turkey' && job.sex === 'male' && job.beard_attached !== undefined && 
                ` • Beard ${job.beard_attached ? 'attached' : 'not attached'}`}
            </Text>
            
            <Text style={styles.reviewLabel}>Date Killed</Text>
            <Text style={styles.reviewValue}>{job.date_killed}</Text>
            
            <Text style={styles.reviewLabel}>License/Confirmation Number</Text>
            <Text style={styles.reviewValue}>{job.license_no}</Text>
            
            {job.ranch_area && (
              <>
                <Text style={styles.reviewLabel}>Ranch/Hunting Area</Text>
                <Text style={styles.reviewValue}>{job.ranch_area}</Text>
              </>
            )}
            
            <Text style={styles.reviewLabel}>Location</Text>
            <Text style={styles.reviewValue}>
              {[job.county, job.state].filter(Boolean).join(', ') || 'Not specified'}
            </Text>
          </View>
        </View>

        {/* Work Order */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Work Order</Text>
          </View>
          
          <View style={styles.reviewCard}>
            <Text style={styles.reviewLabel}>Processing Type</Text>
            <Text style={styles.reviewValue}>{formatProcessingType(job.processing_type || '')}</Text>
            
            {['standard', 'processing_only'].includes(job.processing_type || '') && (
              <>
                <Text style={styles.reviewLabel}>Cut Preferences</Text>
                <Text style={styles.reviewValue}>
                  {Object.entries(job.cut_sheet || {})
                    .filter(([_, selected]) => selected)
                    .map(([key, _]) => {
                      const cutOptions: Record<string, string> = {
                        steaks: 'Steaks',
                        roasts: 'Roasts',
                        ground_meat: 'Ground Meat',
                        sausage: 'Sausage',
                        jerky: 'Jerky',
                        backstrap: 'Backstrap Whole',
                        tenderloin: 'Tenderloin Whole',
                      };
                      return cutOptions[key];
                    })
                    .join(', ') || 'None selected'}
                </Text>
              </>
            )}
            
            {job.instructions && (
              <>
                <Text style={styles.reviewLabel}>Special Instructions</Text>
                <Text style={styles.reviewValue}>{job.instructions}</Text>
              </>
            )}
          </View>
        </View>

        {/* Compliance Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Compliance Documents</Text>
          </View>
          
          <View style={styles.complianceCard}>
            <Text style={styles.complianceText}>
              The following documents will be automatically generated:
            </Text>
            <View style={styles.documentList}>
              <View style={styles.documentItem}>
                <View style={styles.documentBullet} />
                <Text style={styles.documentText}>PWD-535 Proof of Sex Receipt</Text>
              </View>
              <View style={styles.documentItem}>
                <View style={styles.documentBullet} />
                <Text style={styles.documentText}>Wildlife Resource Document (WRD)</Text>
              </View>
            </View>
            <View style={styles.printNotice}>
              <Printer size={16} color="#0EA5E9" />
              <Text style={styles.printNoticeText}>
                Documents will be ready for AirPrint after submission
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Check size={20} color="white" />
          <Text style={styles.submitButtonText}>
            {submitting ? 'Creating Job...' : 'Create Job & Generate Documents'}
          </Text>
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
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  reviewCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    lineHeight: 22,
  },
  complianceCard: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  complianceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
    marginBottom: 12,
  },
  documentList: {
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0EA5E9',
    marginRight: 12,
  },
  documentText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#0369A1',
  },
  printNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#BAE6FD',
  },
  printNoticeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});