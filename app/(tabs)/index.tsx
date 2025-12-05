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
import { Plus, Search, Calendar, FileText, Bell, TrendingUp } from 'lucide-react-native';

type JobWithCustomer = JobRow & {
  customer: CustomerRow;
};

export default function HomeScreen() {
  const [todaysJobs, setTodaysJobs] = useState<JobWithCustomer[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    readyForPickup: 0,
    inProcess: 0,
    overdueJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get today's jobs
      const today = new Date().toISOString().split('T')[0];
      const { data: jobsData, error: jobsError } = await supabase
        .from('job')
        .select(`
          *,
          customer (*)
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setTodaysJobs(jobsData as JobWithCustomer[]);

      // Get stats
      const { data: allJobs, error: statsError } = await supabase
        .from('job')
        .select('status, created_at');

      if (statsError) throw statsError;

      const totalJobs = allJobs?.length || 0;
      const readyForPickup = allJobs?.filter(j => j.status === 'ready').length || 0;
      const inProcess = allJobs?.filter(j => ['received', 'in_cooler', 'skinned_quartered', 'processing', 'freezer'].includes(j.status)).length || 0;
      
      // Calculate overdue jobs (in ready status for more than 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const overdueJobs = allJobs?.filter(j => 
        j.status === 'ready' && 
        new Date(j.created_at) < threeDaysAgo
      ).length || 0;

      setStats({ totalJobs, readyForPickup, inProcess, overdueJobs });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: '#6B7280',
      in_cooler: '#3B82F6',
      skinned_quartered: '#8B5CF6',
      processing: '#F59E0B',
      freezer: '#0EA5E9',
      ready: '#10B981',
      picked_up: '#059669',
      paid: '#059669',
    };
    return colors[status] || '#6B7280';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tall Pine Taxidermy</Text>
        <Text style={styles.subtitle}>Dashboard</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#F0F9FF' }]}>
          <Text style={[styles.statNumber, { color: '#0EA5E9' }]}>{stats.totalJobs}</Text>
          <Text style={styles.statLabel}>Total Jobs</Text>
          <TrendingUp size={20} color="#0EA5E9" style={styles.statIcon} />
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.readyForPickup}</Text>
          <Text style={styles.statLabel}>Ready</Text>
          <Bell size={20} color="#10B981" style={styles.statIcon} />
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.inProcess}</Text>
          <Text style={styles.statLabel}>In Process</Text>
          <Calendar size={20} color="#F59E0B" style={styles.statIcon} />
        </View>
        
        <View style={[styles.statCard, { backgroundColor: stats.overdueJobs > 0 ? '#FEF2F2' : '#F9FAFB' }]}>
          <Text style={[styles.statNumber, { color: stats.overdueJobs > 0 ? '#EF4444' : '#6B7280' }]}>
            {stats.overdueJobs}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#059669' }]}
            onPress={() => router.push('/intake')}
          >
            <Plus size={24} color="white" />
            <Text style={styles.actionText}>New Job</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#0EA5E9' }]}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Search size={24} color="white" />
            <Text style={styles.actionText}>Find Job</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#8B5CF6' }]}
            onPress={() => router.push('/(tabs)/queue')}
          >
            <Calendar size={24} color="white" />
            <Text style={styles.actionText}>Today's Queue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#F97316' }]}
            onPress={() => router.push('/(tabs)/reports')}
          >
            <FileText size={24} color="white" />
            <Text style={styles.actionText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Jobs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Jobs</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : todaysJobs.length > 0 ? (
          <View style={styles.jobsList}>
            {todaysJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => router.push(`/job/${job.id}`)}
              >
                <View style={styles.jobHeader}>
                  <Text style={styles.jobInvoice}>#{job.invoice_no}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                    <Text style={styles.statusText}>{formatStatus(job.status)}</Text>
                  </View>
                </View>
                <Text style={styles.jobCustomer}>{job.customer.name}</Text>
                <View style={styles.jobDetails}>
                  <Text style={styles.jobDetailText}>
                    {formatStatus(job.species)} • {formatStatus(job.sex)} • {job.processing_type}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No jobs created today</Text>
          </View>
        )}
      </View>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  statIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginTop: 8,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  jobCustomer: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  jobDetails: {
    marginTop: 4,
  },
  jobDetailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textTransform: 'capitalize',
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});