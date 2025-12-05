import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { JobRow, CustomerRow } from '@/types/database';
import { Calendar, Clock, Weight, Bell, ArrowRight, DollarSign } from 'lucide-react-native';
import { getWorkflowStage, formatStatus, getTaxidermyStage } from '@/lib/workflow';

type JobWithCustomer = JobRow & {
  customer: CustomerRow;
};

export default function QueueScreen() {
  const [todaysQueue, setTodaysQueue] = useState<JobWithCustomer[]>([]);
  const [readyJobs, setReadyJobs] = useState<JobWithCustomer[]>([]);
  const [processingJobs, setProcessingJobs] = useState<JobWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueueData();
  }, []);

  const loadQueueData = async () => {
    try {
      setLoading(true);
      
      // Get today's queue (jobs created today)
      const today = new Date().toISOString().split('T')[0];
      const { data: todaysData, error: todaysError } = await supabase
        .from('job')
        .select(`
          *,
          customer (*)
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .neq('status', 'paid')
        .order('created_at', { ascending: false });

      if (todaysError) throw todaysError;
      setTodaysQueue(todaysData as JobWithCustomer[]);

      // Get jobs ready for pickup
      const { data: readyData, error: readyError } = await supabase
        .from('job')
        .select(`
          *,
          customer (*)
        `)
        .eq('status', 'ready')
        .order('created_at', { ascending: true });

      if (readyError) throw readyError;
      setReadyJobs(readyData as JobWithCustomer[]);

      // Get jobs currently being processed
      const { data: processingData, error: processingError } = await supabase
        .from('job')
        .select(`
          *,
          customer (*)
        `)
        .in('status', ['received', 'in_cooler', 'hide_removed', 'cut_and_bagged', 'skinned_quartered', 'processing', 'freezer'])
        .order('created_at', { ascending: true });

      if (processingError) throw processingError;
      setProcessingJobs(processingData as JobWithCustomer[]);
    } catch (error) {
      console.error('Error loading queue data:', error);
      Alert.alert('Error', 'Failed to load queue data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const stage = getWorkflowStage(status);
    return stage ? stage.color : '#6B7280';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysOld = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const JobCard = ({ job, showActions = false }: { job: JobWithCustomer; showActions?: boolean }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => router.push(`/job/${job.id}`)}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleRow}>
          <Text style={styles.jobInvoice}>#{job.invoice_no}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <Text style={styles.statusText}>{formatStatus(job.status)}</Text>
          </View>
        </View>
        <View style={styles.jobMeta}>
          <View style={styles.metaItem}>
            <Calendar size={12} color="#6B7280" />
            <Text style={styles.metaText}>{formatDate(job.created_at)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={12} color="#6B7280" />
            <Text style={styles.metaText}>{getDaysOld(job.created_at)}d old</Text>
          </View>
        </View>
      </View>

      <Text style={styles.customerName}>{job.customer.name}</Text>
      <Text style={styles.animalInfo}>
        {formatStatus(job.species)} • {formatStatus(job.sex)} • {job.processing_type}
      </Text>

      <View style={styles.jobFlags}>
        {!job.deposit_paid && (
          <View style={[styles.flagBadge, { backgroundColor: '#FEF3C7' }]}>
            <DollarSign size={10} color="#F59E0B" />
            <Text style={[styles.flagText, { color: '#F59E0B' }]}>Deposit Required</Text>
          </View>
        )}
        {job.mount_requested && (
          <View style={[styles.flagBadge, { backgroundColor: '#E0E7FF' }]}>
            <Text style={[styles.flagText, { color: '#4F46E5' }]}>Mount</Text>
          </View>
        )}
        {job.hide_return_requested && (
          <View style={[styles.flagBadge, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.flagText, { color: '#2563EB' }]}>Hide Return</Text>
          </View>
        )}
        {job.taxidermy_stage && (
          <View style={[styles.flagBadge, { backgroundColor: '#F3E8FF' }]}>
            <Text style={[styles.flagText, { color: '#7C3AED' }]}>{formatStatus(job.taxidermy_stage)}</Text>
          </View>
        )}
      </View>

      {job.hang_weight && (
        <View style={styles.weightInfo}>
          <Weight size={14} color="#6B7280" />
          <Text style={styles.weightText}>Hang: {job.hang_weight} lbs</Text>
          {job.yield_weight && (
            <Text style={styles.weightText}>Yield: {job.yield_weight} lbs</Text>
          )}
        </View>
      )}

      {showActions && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/processing/${job.id}`);
            }}
          >
            <Text style={styles.quickActionText}>Add Weight</Text>
          </TouchableOpacity>
          
          {job.status === 'ready' && (
            <TouchableOpacity
              style={[styles.quickActionButton, styles.notifyButton]}
              onPress={(e) => {
                e.stopPropagation();
                // Handle notify action
                Alert.alert('Notify Customer', 'Send notification to customer?');
              }}
            >
              <Bell size={14} color="white" />
              <Text style={[styles.quickActionText, { color: 'white' }]}>Notify</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Queue</Text>
        <Text style={styles.subtitle}>Jobs and workflow management</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading queue...</Text>
        </View>
      ) : (
        <>
          {/* Ready for Pickup Section */}
          {readyJobs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: '#10B981' }]}>
                  Ready for Pickup ({readyJobs.length})
                </Text>
                <TouchableOpacity 
                  style={styles.sectionAction}
                  onPress={() => router.push('/notifications')}
                >
                  <Bell size={16} color="#10B981" />
                  <Text style={styles.sectionActionText}>Batch Notify</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.jobsList}>
                {readyJobs.map((job) => (
                  <JobCard key={job.id} job={job} showActions />
                ))}
              </View>
            </View>
          )}

          {/* Today's Jobs Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Today's Jobs ({todaysQueue.length})
            </Text>
            {todaysQueue.length > 0 ? (
              <View style={styles.jobsList}>
                {todaysQueue.map((job) => (
                  <JobCard key={job.id} job={job} showActions />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No jobs created today</Text>
              </View>
            )}
          </View>

          {/* In Process Section */}
          {processingJobs.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
                In Process ({processingJobs.length})
              </Text>
              <View style={styles.jobsList}>
                {processingJobs.map((job) => (
                  <JobCard key={job.id} job={job} showActions />
                ))}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.gridAction}
                onPress={() => router.push('/intake')}
              >
                <Text style={styles.gridActionText}>New Job</Text>
                <ArrowRight size={16} color="#059669" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.gridAction}
                onPress={() => router.push('/notifications')}
              >
                <Text style={styles.gridActionText}>Batch Notify</Text>
                <ArrowRight size={16} color="#059669" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  sectionActionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobHeader: {
    marginBottom: 8,
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobInvoice: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  animalInfo: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  jobFlags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flagText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  weightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  weightText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
  notifyButton: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  quickActionsGrid: {
    gap: 12,
  },
  gridAction: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridActionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
});