import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Calendar, FileText, Download, ListFilter as Filter } from 'lucide-react-native';

export default function ReportsScreen() {
  const [selectedDateRange, setSelectedDateRange] = useState('today');

  const handleExportCSV = async () => {
    Alert.alert(
      'Export CSV',
      'Export job data for the selected date range?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => exportData() },
      ]
    );
  };

  const exportData = async () => {
    // TODO: Implement CSV export logic
    Alert.alert('Success', 'CSV export functionality will be implemented');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Export</Text>
        <Text style={styles.subtitle}>Generate reports and export data</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Range Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.dateRangeOptions}>
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
              { key: 'custom', label: 'Custom Range' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.dateOption,
                  selectedDateRange === option.key && styles.dateOptionSelected
                ]}
                onPress={() => setSelectedDateRange(option.key)}
              >
                <Text style={[
                  styles.dateOptionText,
                  selectedDateRange === option.key && styles.dateOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Options</Text>
          
          <TouchableOpacity style={styles.exportCard} onPress={handleExportCSV}>
            <View style={styles.exportIcon}>
              <FileText size={24} color="white" />
            </View>
            <View style={styles.exportContent}>
              <Text style={styles.exportTitle}>CSV Export</Text>
              <Text style={styles.exportDescription}>
                Export all job data with customer information, compliance status, and payment details
              </Text>
            </View>
            <Download size={20} color="#059669" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportCard}>
            <View style={[styles.exportIcon, { backgroundColor: '#8B5CF6' }]}>
              <FileText size={24} color="white" />
            </View>
            <View style={styles.exportContent}>
              <Text style={styles.exportTitle}>PDF Bundle</Text>
              <Text style={styles.exportDescription}>
                Generate a zip file containing all compliance documents for the selected period
              </Text>
            </View>
            <Download size={20} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {/* Report Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Filters</Text>
          
          <View style={styles.filterGrid}>
            <TouchableOpacity style={styles.filterCard}>
              <Filter size={20} color="#6B7280" />
              <Text style={styles.filterText}>By Status</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterCard}>
              <Filter size={20} color="#6B7280" />
              <Text style={styles.filterText}>By Species</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterCard}>
              <Filter size={20} color="#6B7280" />
              <Text style={styles.filterText}>By Processing Type</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterCard}>
              <Filter size={20} color="#6B7280" />
              <Text style={styles.filterText}>Payment Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Jobs Today</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Ready for Pickup</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>$0</Text>
              <Text style={styles.statLabel}>Revenue (MTD)</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Avg. Turnaround</Text>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  dateRangeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  dateOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dateOptionSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  dateOptionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  dateOptionTextSelected: {
    color: 'white',
  },
  exportCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exportContent: {
    flex: 1,
    marginRight: 16,
  },
  exportTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});