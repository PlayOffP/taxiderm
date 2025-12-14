import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { JobRow, CustomerRow, PaymentRow } from '@/types/database';
import { ArrowLeft, FileText, Calendar, Package, DollarSign, Activity, CheckCircle2, Circle, AlertCircle, CreditCard, Banknote } from 'lucide-react-native';
import { PROCESSING_WORKFLOW, TAXIDERMY_WORKFLOW, formatStatus as formatWorkflowStatus, getWorkflowProgress } from '@/lib/workflow';
import StripePaymentModal from '@/components/StripePaymentModal';

type JobWithCustomer = JobRow & {
  customer: CustomerRow;
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobWithCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'card'>('card');
  const [paymentType, setPaymentType] = useState<'deposit' | 'final'>('deposit');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);

  useEffect(() => {
    loadJob();
    loadPayments();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job')
        .select(`
          *,
          customer (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data as JobWithCustomer);
    } catch (error) {
      console.error('Error loading job:', error);
      Alert.alert('Error', 'Failed to load job details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payment')
        .select('*')
        .eq('job_id', id)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const workflow = PROCESSING_WORKFLOW.find(s => s.id === status);
    return workflow ? workflow.color : '#6B7280';
  };

  const formatStatus = formatWorkflowStatus;

  const updateJobStatus = async (newStatus: string) => {
    if (!job) return;

    try {
      const { error } = await supabase
        .from('job')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', job.id);

      if (error) throw error;
      await loadJob();
      Alert.alert('Success', 'Job status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update job status');
    }
  };

  const updateTaxidermyStage = async (newStage: string) => {
    if (!job) return;

    try {
      const { error } = await supabase
        .from('job')
        .update({ taxidermy_stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', job.id);

      if (error) throw error;
      await loadJob();
      Alert.alert('Success', 'Taxidermy stage updated');
    } catch (error) {
      console.error('Error updating stage:', error);
      Alert.alert('Error', 'Failed to update taxidermy stage');
    }
  };

  const processPayment = async () => {
    if (!job || !paymentAmount || isNaN(parseFloat(paymentAmount))) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      Alert.alert('Error', 'Payment amount must be greater than 0');
      return;
    }

    setProcessingPayment(true);

    try {
      if (paymentMethod === 'card') {
        setShowStripeModal(true);
        setProcessingPayment(false);
        return;
      }

      const { data: payment, error } = await supabase
        .from('payment')
        .insert({
          job_id: job.id,
          method: paymentMethod,
          total: amount,
          payment_type: paymentType,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      if (paymentType === 'deposit') {
        await supabase
          .from('job')
          .update({
            deposit_paid: true,
            deposit_amount: amount,
          })
          .eq('id', job.id);
      } else if (paymentType === 'final') {
        await supabase
          .from('job')
          .update({
            status: 'paid',
          })
          .eq('id', job.id);
      }

      await loadJob();
      await loadPayments();
      setPaymentAmount('');
      Alert.alert('Success', 'Payment recorded successfully');
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    await loadJob();
    await loadPayments();
    setPaymentAmount('');
    Alert.alert('Success', 'Payment processed successfully');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Job not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>#{job.invoice_no}</Text>
          <Text style={styles.headerSubtitle}>{job.customer.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
          <Text style={styles.statusText}>{formatStatus(job.status)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {[
            { key: 'overview', label: 'Overview', icon: FileText },
            { key: 'compliance', label: 'Compliance', icon: FileText },
            { key: 'processing', label: 'Processing', icon: Package },
            { key: 'payments', label: 'Payments', icon: DollarSign },
            { key: 'activity', label: 'Activity', icon: Activity },
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.tabActive
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <IconComponent 
                  size={16} 
                  color={activeTab === tab.key ? '#059669' : '#6B7280'} 
                />
                <Text style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Workflow Progress */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workflow Progress</Text>
              {!job.deposit_paid && (
                <View style={styles.warningBanner}>
                  <AlertCircle size={20} color="#F59E0B" />
                  <Text style={styles.warningText}>Deposit payment required to proceed</Text>
                </View>
              )}

              {/* Workflow Decisions */}
              <View style={styles.decisionCard}>
                <View style={styles.decisionRow}>
                  <Text style={styles.decisionLabel}>Mount Requested:</Text>
                  <Text style={[styles.decisionValue, { color: job.mount_requested ? '#10B981' : '#6B7280' }]}>
                    {job.mount_requested ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.decisionRow}>
                  <Text style={styles.decisionLabel}>Hide Return:</Text>
                  <Text style={[styles.decisionValue, { color: job.hide_return_requested ? '#10B981' : '#6B7280' }]}>
                    {job.hide_return_requested ? 'Yes' : 'No'}
                  </Text>
                </View>
                {job.deposit_paid && (
                  <View style={styles.decisionRow}>
                    <Text style={styles.decisionLabel}>Deposit Paid:</Text>
                    <Text style={[styles.decisionValue, { color: '#10B981' }]}>✓ ${job.deposit_amount}</Text>
                  </View>
                )}
              </View>

              {/* Processing Workflow */}
              <Text style={styles.workflowTitle}>Processing Stages</Text>
              {PROCESSING_WORKFLOW.map((stage, index) => {
                const isCompleted = PROCESSING_WORKFLOW.findIndex(s => s.id === job.status) >= index;
                const isCurrent = stage.id === job.status;

                return (
                  <TouchableOpacity
                    key={stage.id}
                    style={[
                      styles.workflowStage,
                      isCurrent && styles.workflowStageCurrent,
                      isCompleted && styles.workflowStageCompleted,
                    ]}
                    onPress={() => {
                      if (job.deposit_paid || stage.order <= 1) {
                        Alert.alert(
                          'Update Status',
                          `Move job to "${stage.label}"?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Update', onPress: () => updateJobStatus(stage.id) },
                          ]
                        );
                      } else {
                        Alert.alert('Deposit Required', 'Deposit must be paid before processing');
                      }
                    }}
                  >
                    <View style={styles.workflowStageIcon}>
                      {isCompleted ? (
                        <CheckCircle2 size={20} color={isCurrent ? stage.color : '#10B981'} />
                      ) : (
                        <Circle size={20} color="#D1D5DB" />
                      )}
                    </View>
                    <View style={styles.workflowStageContent}>
                      <Text style={[
                        styles.workflowStageLabel,
                        isCurrent && styles.workflowStageLabelCurrent,
                      ]}>
                        {stage.label}
                      </Text>
                      <Text style={styles.workflowStageDescription}>{stage.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Taxidermy Workflow (if mount requested) */}
              {job.mount_requested && (
                <>
                  <Text style={[styles.workflowTitle, { marginTop: 24 }]}>Taxidermy Stages</Text>
                  {TAXIDERMY_WORKFLOW.map((stage, index) => {
                    const currentStageIndex = TAXIDERMY_WORKFLOW.findIndex(s => s.id === job.taxidermy_stage);
                    const isCompleted = currentStageIndex >= index;
                    const isCurrent = stage.id === job.taxidermy_stage;

                    return (
                      <TouchableOpacity
                        key={stage.id}
                        style={[
                          styles.workflowStage,
                          isCurrent && styles.workflowStageCurrent,
                          isCompleted && styles.workflowStageCompleted,
                        ]}
                        onPress={() => {
                          Alert.alert(
                            'Update Taxidermy Stage',
                            `Move to "${stage.label}"?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Update', onPress: () => updateTaxidermyStage(stage.id) },
                            ]
                          );
                        }}
                      >
                        <View style={styles.workflowStageIcon}>
                          {isCompleted ? (
                            <CheckCircle2 size={20} color={isCurrent ? stage.color : '#10B981'} />
                          ) : (
                            <Circle size={20} color="#D1D5DB" />
                          )}
                        </View>
                        <View style={styles.workflowStageContent}>
                          <Text style={[
                            styles.workflowStageLabel,
                            isCurrent && styles.workflowStageLabelCurrent,
                          ]}>
                            {stage.label}
                          </Text>
                          <Text style={styles.workflowStageDescription}>{stage.description}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </View>
            {/* Customer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{job.customer.name}</Text>
                
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{job.customer.phone}</Text>
                
                {job.customer.email && (
                  <>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{job.customer.email}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Animal Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Animal Information</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Species & Sex</Text>
                <Text style={styles.infoValue}>
                  {`${job.species.charAt(0).toUpperCase() + job.species.slice(1)} • ${job.sex.charAt(0).toUpperCase() + job.sex.slice(1)}${job.antler_points ? ` • ${job.antler_points} points` : ''}${job.beard_attached !== null ? ` • Beard ${job.beard_attached ? 'attached' : 'not attached'}` : ''}`}
                </Text>
                
                <Text style={styles.infoLabel}>Date Killed</Text>
                <Text style={styles.infoValue}>{formatDate(job.date_killed)}</Text>
                
                <Text style={styles.infoLabel}>License Number</Text>
                <Text style={styles.infoValue}>{job.license_no}</Text>
                
                {job.ranch_area && (
                  <>
                    <Text style={styles.infoLabel}>Ranch/Area</Text>
                    <Text style={styles.infoValue}>{job.ranch_area}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Processing Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Processing Information</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Processing Type</Text>
                <Text style={styles.infoValue}>{job.processing_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{formatDate(job.created_at)}</Text>
                
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>{formatDate(job.updated_at)}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'compliance' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compliance Documents</Text>
              <Text style={styles.sectionSubtitle}>
                Required documents for this job
              </Text>
              
              <View style={styles.documentCard}>
                <Text style={styles.documentTitle}>PWD-535 Proof of Sex Receipt</Text>
                <Text style={styles.documentStatus}>Ready for printing</Text>
                <TouchableOpacity 
                  style={styles.documentButton}
                  onPress={() => router.push(`/compliance/${job.id}/PWD-535`)}
                >
                  <FileText size={16} color="#059669" />
                  <Text style={styles.documentButtonText}>View & Print</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.documentCard}>
                <Text style={styles.documentTitle}>Wildlife Resource Document</Text>
                <Text style={styles.documentStatus}>Ready for printing</Text>
                <TouchableOpacity 
                  style={styles.documentButton}
                  onPress={() => router.push(`/compliance/${job.id}/WRD`)}
                >
                  <FileText size={16} color="#059669" />
                  <Text style={styles.documentButtonText}>View & Print</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              <View style={styles.paymentSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Paid:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(payments.reduce((sum, p) => sum + p.total, 0))}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Deposit Status:</Text>
                  <Text style={[styles.summaryValue, { color: job.deposit_paid ? '#10B981' : '#EF4444' }]}>
                    {job.deposit_paid ? `Paid ($${job.deposit_amount})` : 'Not Paid'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Final Payment:</Text>
                  <Text style={[styles.summaryValue, { color: job.status === 'paid' ? '#10B981' : '#6B7280' }]}>
                    {job.status === 'paid' ? 'Complete' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Record Payment</Text>
              <View style={styles.paymentFormCard}>
                <Text style={styles.formLabel}>Payment Type</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[styles.radioButton, paymentType === 'deposit' && styles.radioButtonActive]}
                    onPress={() => setPaymentType('deposit')}
                  >
                    <View style={[styles.radio, paymentType === 'deposit' && styles.radioActive]}>
                      {paymentType === 'deposit' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.radioLabel, paymentType === 'deposit' && styles.radioLabelActive]}>
                      Deposit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, paymentType === 'final' && styles.radioButtonActive]}
                    onPress={() => setPaymentType('final')}
                  >
                    <View style={[styles.radio, paymentType === 'final' && styles.radioActive]}>
                      {paymentType === 'final' && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.radioLabel, paymentType === 'final' && styles.radioLabelActive]}>
                      Final Payment
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.formLabel}>Payment Method</Text>
                <View style={styles.methodGroup}>
                  <TouchableOpacity
                    style={[styles.methodButton, paymentMethod === 'cash' && styles.methodButtonActive]}
                    onPress={() => setPaymentMethod('cash')}
                  >
                    <Banknote size={20} color={paymentMethod === 'cash' ? '#059669' : '#6B7280'} />
                    <Text style={[styles.methodText, paymentMethod === 'cash' && styles.methodTextActive]}>
                      Cash
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodButton, paymentMethod === 'check' && styles.methodButtonActive]}
                    onPress={() => setPaymentMethod('check')}
                  >
                    <FileText size={20} color={paymentMethod === 'check' ? '#059669' : '#6B7280'} />
                    <Text style={[styles.methodText, paymentMethod === 'check' && styles.methodTextActive]}>
                      Check
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodButton, paymentMethod === 'card' && styles.methodButtonActive]}
                    onPress={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={20} color={paymentMethod === 'card' ? '#059669' : '#6B7280'} />
                    <Text style={[styles.methodText, paymentMethod === 'card' && styles.methodTextActive]}>
                      Card
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.formLabel}>Amount</Text>
                <TextInput
                  style={styles.amountInput}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                />

                <TouchableOpacity
                  style={[styles.processButton, processingPayment && styles.processButtonDisabled]}
                  onPress={processPayment}
                  disabled={processingPayment}
                >
                  <Text style={styles.processButtonText}>
                    {processingPayment ? 'Processing...' : 'Record Payment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment History</Text>
              {payments.length === 0 ? (
                <View style={styles.emptyState}>
                  <DollarSign size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No payments recorded yet</Text>
                </View>
              ) : (
                payments.map((payment) => (
                  <View key={payment.id} style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentAmount}>{formatCurrency(payment.total)}</Text>
                        <Text style={styles.paymentType}>
                          {payment.payment_type.charAt(0).toUpperCase() + payment.payment_type.slice(1)}
                        </Text>
                      </View>
                      <View style={[styles.paymentMethodBadge, { backgroundColor: payment.method === 'card' ? '#EFF6FF' : payment.method === 'cash' ? '#F0FDF4' : '#FEF3C7' }]}>
                        <Text style={[styles.paymentMethodText, { color: payment.method === 'card' ? '#3B82F6' : payment.method === 'cash' ? '#10B981' : '#F59E0B' }]}>
                          {payment.method.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.paymentDetails}>
                      <Text style={styles.paymentDate}>{formatDate(payment.paid_at)}</Text>
                      {payment.card_last4 && (
                        <Text style={styles.paymentCardInfo}>
                          {`${payment.card_brand} •••• ${payment.card_last4}`}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Other tabs */}
        {activeTab !== 'overview' && activeTab !== 'compliance' && activeTab !== 'payments' && (
          <View style={styles.tabContent}>
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonText}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab coming soon
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {job && (
        <StripePaymentModal
          visible={showStripeModal}
          onClose={() => setShowStripeModal(false)}
          onSuccess={handleStripePaymentSuccess}
          jobId={job.id}
          amount={parseFloat(paymentAmount) || 0}
          paymentType={paymentType}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabs: {
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#059669',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  tabContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
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
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    lineHeight: 22,
  },
  documentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
    marginBottom: 12,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    alignSelf: 'flex-start',
    gap: 6,
  },
  documentButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
  },
  comingSoonContainer: {
    padding: 40,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
  decisionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  decisionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  decisionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  decisionValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  workflowTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  workflowStage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  workflowStageCurrent: {
    borderColor: '#059669',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  workflowStageCompleted: {
    backgroundColor: '#F9FAFB',
  },
  workflowStageIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  workflowStageContent: {
    flex: 1,
  },
  workflowStageLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  workflowStageLabelCurrent: {
    color: '#059669',
  },
  workflowStageDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  paymentSummaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  paymentFormCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
    marginTop: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  radioButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#059669',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  radioLabelActive: {
    color: '#059669',
  },
  methodGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  methodButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  methodText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  methodTextActive: {
    color: '#059669',
  },
  amountInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  processButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  processButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  processButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 12,
  },
  paymentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  paymentType: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  paymentMethodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentMethodText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  paymentDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  paymentCardInfo: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
});