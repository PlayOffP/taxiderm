import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { CustomerInsert } from '@/types/database';
import { ArrowLeft, ArrowRight, User, Phone, Mail, MapPin } from 'lucide-react-native';

export default function IntakeStep1Screen() {
  const [customer, setCustomer] = useState<CustomerInsert>({
    name: '',
    phone: '',
    email: '',
    address_line1: '',
    city: '',
    state: 'TX',
    zip: '',
    sms_opt_in: true,
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!customer.name?.trim()) {
      Alert.alert('Validation Error', 'Customer name is required');
      return false;
    }
    if (!customer.phone?.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Check if customer already exists by phone
      const { data: existingCustomers, error: searchError } = await supabase
        .from('customer')
        .select('*')
        .eq('phone', customer.phone);

      if (searchError) throw searchError;

      let customerId: string;

      if (existingCustomers && existingCustomers.length > 0) {
        // Customer exists, use existing record
        customerId = existingCustomers[0].id;
        
        // For existing customers, just continue to step 2
        router.push({
          pathname: '/intake/step2',
          params: { customerId }
        });
        return;
      } else {
        // 2) Insert new customer
        const { data: newCustomer, error: insertError } = await supabase
          .from('customer')
          .insert([{
            name: customer.name,
            phone: customer.phone,
            email: customer.email || null,
            address_line1: customer.address_line1 || null,
            city: customer.city || null,
            state: customer.state || 'TX',
            zip: customer.zip || null,
            sms_opt_in: customer.sms_opt_in ?? true,
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        customerId = newCustomer.id;

        // Navigate to step 2 for new customers
        router.push({
          pathname: '/intake/step2',
          params: { customerId }
        });
      }
    } catch (error: any) {
      console.error('Error handling customer:', error);
      const errorMessage = error?.message || 'Failed to process customer information';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerSubtitle}>Step 1 of 4: Customer Information</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={styles.progressStep} />
        <View style={styles.progressStep} />
        <View style={styles.progressStep} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Name *</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={customer.name}
                onChangeText={(text) => setCustomer({ ...customer, name: text })}
                placeholder="Enter customer's full name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={customer.phone}
                onChangeText={(text) => setCustomer({ ...customer, phone: text })}
                placeholder="(555) 123-4567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Optional)</Text>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={customer.email || ''}
                onChangeText={(text) => setCustomer({ ...customer, email: text })}
                placeholder="customer@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.smsOptInContainer}>
            <View style={styles.smsOptInContent}>
              <Text style={styles.smsOptInLabel}>SMS Notifications</Text>
              <Text style={styles.smsOptInSubtext}>
                Receive text messages for job updates and pickup notifications
              </Text>
            </View>
            <Switch
              value={customer.sms_opt_in}
              onValueChange={(value) => setCustomer({ ...customer, sms_opt_in: value })}
              trackColor={{ false: '#E5E7EB', true: '#D1FAE5' }}
              thumbColor={customer.sms_opt_in ? '#059669' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={customer.address_line1 || ''}
                onChangeText={(text) => setCustomer({ ...customer, address_line1: text })}
                placeholder="123 Main Street"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.addressRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={customer.city || ''}
                onChangeText={(text) => setCustomer({ ...customer, city: text })}
                placeholder="Dallas"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, { width: 80, marginRight: 8 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={customer.state || 'TX'}
                onChangeText={(text) => setCustomer({ ...customer, state: text })}
                placeholder="TX"
                placeholderTextColor="#9CA3AF"
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>

            <View style={[styles.inputGroup, { width: 100 }]}>
              <Text style={styles.label}>ZIP</Text>
              <TextInput
                style={styles.input}
                value={customer.zip || ''}
                onChangeText={(text) => setCustomer({ ...customer, zip: text })}
                placeholder="75001"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {loading ? 'Processing...' : 'Next: Animal Info'}
          </Text>
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
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  smsOptInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  smsOptInContent: {
    flex: 1,
    marginRight: 16,
  },
  smsOptInLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  smsOptInSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
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