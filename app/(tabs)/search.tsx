import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { JobRow, CustomerRow } from '@/types/database';
import { Search, Phone, FileText, Calendar } from 'lucide-react-native';

type JobWithCustomer = JobRow & {
  customer: CustomerRow;
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JobWithCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      
      // Search by customer name, phone, or invoice number
      const { data, error } = await supabase
        .from('job')
        .select(`
          *,
          customer (*)
        `)
        .or(`invoice_no.ilike.%${query}%,customer.name.ilike.%${query}%,customer.phone.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSearchResults(data as JobWithCustomer[]);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Job</Text>
        <Text style={styles.subtitle}>Search by name, phone, or invoice #</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter name, phone number, or invoice #..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchQuery.trim() && searchResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No jobs found for "{searchQuery}"</Text>
            <Text style={styles.emptySubtext}>
              Try searching by customer name, phone number, or invoice number
            </Text>
          </View>
        ) : searchResults.length > 0 ? (
          <View style={styles.resultsList}>
            <Text style={styles.resultsHeader}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </Text>
            {searchResults.map((job) => (
              <TouchableOpacity
                key={job.id}
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
                  <Text style={styles.jobDate}>{formatDate(job.created_at)}</Text>
                </View>

                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{job.customer.name}</Text>
                  {job.customer.phone && (
                    <View style={styles.customerDetail}>
                      <Phone size={14} color="#6B7280" />
                      <Text style={styles.customerDetailText}>{job.customer.phone}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.animalInfo}>
                  <Text style={styles.animalText}>
                    {formatStatus(job.species)} • {formatStatus(job.sex)} • {job.processing_type}
                  </Text>
                  <Text style={styles.dateKilled}>Killed: {formatDate(job.date_killed)}</Text>
                </View>

                <View style={styles.jobActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/job/${job.id}?tab=compliance`)}
                  >
                    <FileText size={16} color="#059669" />
                    <Text style={styles.actionButtonText}>View Docs</Text>
                  </TouchableOpacity>
                  
                  {job.status === 'ready' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.paymentButton]}
                      onPress={() => router.push(`/payment/${job.id}`)}
                    >
                      <Text style={styles.paymentButtonText}>Process Payment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : !searchQuery.trim() ? (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Quick Search</Text>
            <Text style={styles.instructionsText}>
              Start typing to search for jobs by:
            </Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>• Customer name</Text>
              <Text style={styles.instructionItem}>• Phone number</Text>
              <Text style={styles.instructionItem}>• Invoice number</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  content: {
    flex: 1,
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
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsContainer: {
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 24,
  },
  instructionsList: {
    marginLeft: 16,
  },
  instructionItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  resultsList: {
    padding: 20,
  },
  resultsHeader: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 16,
  },
  jobCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  jobHeader: {
    marginBottom: 12,
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobInvoice: {
    fontSize: 18,
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
  jobDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 4,
  },
  customerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerDetailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  animalInfo: {
    marginBottom: 16,
  },
  animalText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  dateKilled: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
  paymentButton: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  paymentButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});