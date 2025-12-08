import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { JobRow, CustomerRow, ComplianceDocRow } from '@/types/database';
import { fillPSR, fillWRD } from '@/lib/pdfStamp';
import { mapPSRFormFields, mapWRD } from '@/lib/psrMapping';
import { ArrowLeft, Download, Printer, Share } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Conditionally import WebView only for native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

type JobWithCustomer = JobRow & {
  customer: CustomerRow;
};

export default function ComplianceDocumentScreen() {
  const { jobId, docType } = useLocalSearchParams<{ 
    jobId: string; 
    docType: 'PWD-535' | 'WRD'; 
  }>();
  
  const [job, setJob] = useState<JobWithCustomer | null>(null);
  const [complianceDoc, setComplianceDoc] = useState<ComplianceDocRow | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadJobAndDocument();
  }, [jobId, docType]);

  const loadJobAndDocument = async () => {
    try {
      setLoading(true);
      
      // Load job with customer
      const { data: jobData, error: jobError } = await supabase
        .from('job')
        .select(`
          *,
          customer (*)
        `)
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData as JobWithCustomer);

      // Load compliance document
      const { data: docData, error: docError } = await supabase
        .from('compliance_doc')
        .select('*')
        .eq('job_id', jobId)
        .eq('type', docType)
        .single();

      if (docError) throw docError;
      setComplianceDoc(docData);

      // Generate PDF if not already generated or if URL is missing
      if (!docData.pdf_url) {
        await generateAndSavePDF(jobData as JobWithCustomer, docData);
      } else {
        setPdfUri(docData.pdf_url);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      Alert.alert('Error', 'Failed to load compliance document');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const savePdfToDatabase = async (jobId: string, docType: string, pdfUrl: string) => {
    try {
      await supabase
        .from('compliance_doc')
        .update({ pdf_url: pdfUrl })
        .eq('job_id', jobId)
        .eq('type', docType);
    } catch (error) {
      console.error('Error saving PDF URL to database:', error);
    }
  };

  const generateAndSavePDF = async (jobData: JobWithCustomer, docData: ComplianceDocRow) => {
    try {
      setGenerating(true);

      let result: { publicUrl: string; dataUrl: string };
      if (docType === 'PWD-535') {
        const formData = mapPSRFormFields(jobData);
        result = await fillPSR(jobData, formData);
      } else {
        const fields = mapWRD(jobData);
        result = await fillWRD(jobData, fields);
      }

      setPdfUri(result.dataUrl || result.publicUrl);
      await savePdfToDatabase(jobData.id, docType, result.publicUrl);

    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF document');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!pdfUri) {
      Alert.alert('Error', 'PDF not generated yet. Please wait for the PDF to load.');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // On web, open the PDF in a new window and trigger print
        const printWindow = window.open(pdfUri, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } else {
        await Print.printAsync({ uri: pdfUri });
      }
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('Error', 'Failed to print document');
    }
  };

  const handleShare = async () => {
    if (!pdfUri) {
      Alert.alert('Error', 'PDF not generated yet. Please wait for the PDF to load.');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${getDocumentTitle()}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share document');
    }
  };

  const openPdfViewer = (pdfUrl: string) => {
    if (Platform.OS === 'web') {
      // Open PDF in new tab on web
      window.open(pdfUrl, '_blank');
    } else {
      // On native, we'll show it in the WebView below
      return;
    }
  };

  const getDocumentTitle = () => {
    return docType === 'PWD-535' ? 'PWD-535 Proof of Sex Receipt' : 'Wildlife Resource Document';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      </View>
    );
  }

  if (!job || !complianceDoc) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Document not found</Text>
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
          <Text style={styles.headerTitle}>{getDocumentTitle()}</Text>
          <Text style={styles.headerSubtitle}>#{job.invoice_no} - {job.customer.name}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePrint}
        >
          <Printer size={20} color="#059669" />
          <Text style={styles.actionButtonText}>Print</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Share size={20} color="#059669" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        
        {Platform.OS === 'web' && pdfUri && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openPdfViewer(pdfUri)}
          >
            <Download size={20} color="#059669" />
            <Text style={styles.actionButtonText}>Open PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        {generating ? (
          <View style={styles.generatingContainer}>
            <Text style={styles.generatingText}>Generating PDF...</Text>
          </View>
        ) : pdfUri && Platform.OS === 'web' ? (
          <iframe
            src={pdfUri}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={getDocumentTitle()}
          />
        ) : pdfUri && Platform.OS !== 'web' && WebView ? (
          <WebView
            source={{ uri: pdfUri }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <Text>Loading PDF...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error: ', nativeEvent);
              Alert.alert('Error', 'Failed to load PDF document');
            }}
          />
        ) : (
          <View style={styles.noPdfContainer}>
            <Text style={styles.noPdfText}>
              {Platform.OS === 'web' ? 'Click "Open PDF" to view the document' : 'PDF not available'}
            </Text>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={() => generateAndSavePDF(job, complianceDoc)}
            >
              <Text style={styles.regenerateButtonText}>Generate PDF</Text>
            </TouchableOpacity>
          </View>
        )}
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
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingText: {
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
  noPdfContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  noPdfText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  regenerateButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  regenerateButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});