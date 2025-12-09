import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { generatePSR, generateWRD } from '../../lib/pdfFlow';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '../../lib/supabase';
import { BUCKET_TEMPLATES, TEMPLATE_PSR } from '../../constants/storage';

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
  const [formFields, setFormFields] = useState<string>('');

  const inspectPDFFields = async () => {
    try {
      const { data } = supabase.storage.from(BUCKET_TEMPLATES).getPublicUrl(TEMPLATE_PSR);
      const templateUrl = data?.publicUrl || '';

      const resp = await fetch(templateUrl);
      const bytes = new Uint8Array(await resp.arrayBuffer());
      const pdf = await PDFDocument.load(bytes);
      const form = pdf.getForm();

      const fields = form.getFields();
      let output = `Total fields: ${fields.length}\n\n`;

      fields.forEach((field) => {
        const name = field.getName();
        const type = field.constructor.name;
        output += `Field: ${name}\n`;
        output += `Type: ${type}\n`;

        if (type === 'PDFRadioGroup') {
          try {
            const radioGroup = form.getRadioGroup(name);
            const options = radioGroup.getOptions();
            output += `Options: ${options.join(', ')}\n`;
          } catch (e) {
            output += `Error getting options\n`;
          }
        }
        output += '\n';
      });

      console.log(output);
      setFormFields(output);
    } catch (e) {
      console.error('Inspect error', e);
      setFormFields('Error: ' + String(e));
    }
  };

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

      <TouchableOpacity onPress={inspectPDFFields} style={{ padding: 12, backgroundColor: '#059669', borderRadius: 8 }}>
        <Text style={{ color: 'white' }}>Inspect PDF Form Fields</Text>
      </TouchableOpacity>

      {formFields ? (
        <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
          <Text selectable style={{ fontSize: 11, fontFamily: 'monospace' }}>{formFields}</Text>
        </View>
      ) : null}

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