import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { generatePSR, generateWRD } from '../../lib/pdfFlow';

const fakeJob = {
  id: 'test-job-123',
  invoice_no: 'TXD-0001',
  date_killed: '2025-09-27',
  species: 'deer',
  sex: 'male',
  antler_points: 8,
  business_name: 'Tall Pine Taxidermy and Deer Processing',
  business_phone: '903-951-3548',
  business_address: '4982 TX-19 S, Sulphur Springs, TX 75482',
  customer: { name: 'John Doe', phone: '5551112222', email: 'john@example.com', address_line1: '123 Main', city: 'SS', state: 'TX', zip: '75482' },
  processing_type: 'Basic',
  instructions: 'Steaks, no roast, grind rest',
  hang_weight: 100,
  yield_weight: 50,
  version: 1
};

export default function Diagnostics() {
  const [psrUrl, setPsrUrl] = useState<string>('');
  const [wrdUrl, setWrdUrl] = useState<string>('');

  const runPSR = async () => {
    try {
      const { dataUrl, publicUrl } = await generatePSR(fakeJob);
      setPsrUrl(dataUrl || publicUrl);
    } catch (e) {
      console.error('PSR error', e);
    }
  };

  const runWRD = async () => {
    try {
      const { dataUrl, publicUrl } = await generateWRD(fakeJob);
      setWrdUrl(dataUrl || publicUrl);
    } catch (e) {
      console.error('WRD error', e);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Diagnostics</Text>

      <TouchableOpacity onPress={runPSR} style={{ padding: 12, backgroundColor: '#111', borderRadius: 8 }}>
        <Text style={{ color: 'white' }}>Generate PSR (PWD-535) Test PDF</Text>
      </TouchableOpacity>

      {psrUrl ? <Text selectable>PSR URL/DataURL: {psrUrl.slice(0, 100)}...</Text> : null}

      <TouchableOpacity onPress={runWRD} style={{ padding: 12, backgroundColor: '#111', borderRadius: 8 }}>
        <Text style={{ color: 'white' }}>Generate WRD Test PDF</Text>
      </TouchableOpacity>

      {wrdUrl ? <Text selectable>WRD URL/DataURL: {wrdUrl.slice(0, 100)}...</Text> : null}
    </ScrollView>
  );
}