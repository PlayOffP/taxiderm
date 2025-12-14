import { supabase } from './supabase';
import { BUCKET_TEMPLATES, BUCKET_DOCUMENTS, TEMPLATE_PSR, TEMPLATE_WRD } from '../constants/storage';
import { fillPdfFromUrl, fillPdfFormFields } from './pdfFill';
import { mapPSR, mapWRD, mapPSRFormFields, mapWRDFormFields } from './psrMapping';

function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

export async function generatePSR(job: any) {
  try {
    const tplUrl = getPublicUrl(BUCKET_TEMPLATES, TEMPLATE_PSR);

    // Check if template exists
    const { data: templateCheck, error: checkError } = await supabase.storage
      .from(BUCKET_TEMPLATES)
      .list('', { search: TEMPLATE_PSR });

    if (checkError || !templateCheck || templateCheck.length === 0) {
      throw new Error(`PSR template not found. Please upload ${TEMPLATE_PSR} to the Templates storage bucket.`);
    }

    const formData = mapPSRFormFields(job);
    const { bytes, dataUrl } = await fillPdfFormFields(tplUrl, formData);

    const path = `documents/${job.id}/PWD-535_v${job.version || 1}.pdf`;
    const { error } = await supabase.storage.from(BUCKET_DOCUMENTS)
      .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
    if (error) throw error;

    const publicUrl = getPublicUrl(BUCKET_DOCUMENTS, path);

    await supabase.from('compliance_doc').update({
      pdf_url: publicUrl,
      version: job.version || 1
    })
    .eq('job_id', job.id)
    .eq('type', 'PWD-535');

    return { publicUrl, dataUrl };
  } catch (error: any) {
    console.error('Error generating PSR:', error);
    throw new Error(error?.message || 'Failed to generate PWD-535 document');
  }
}

export async function generateWRD(job: any) {
  try {
    const tplUrl = getPublicUrl(BUCKET_TEMPLATES, TEMPLATE_WRD);

    // Check if template exists
    const { data: templateCheck, error: checkError } = await supabase.storage
      .from(BUCKET_TEMPLATES)
      .list('', { search: TEMPLATE_WRD });

    if (checkError || !templateCheck || templateCheck.length === 0) {
      throw new Error(`WRD template not found. Please upload ${TEMPLATE_WRD} to the Templates storage bucket.`);
    }

    const formData = mapWRDFormFields(job);
    const { bytes, dataUrl } = await fillPdfFormFields(tplUrl, formData);

    const path = `documents/${job.id}/WRD_v${job.version || 1}.pdf`;
    const { error } = await supabase.storage.from(BUCKET_DOCUMENTS)
      .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
    if (error) throw error;

    const publicUrl = getPublicUrl(BUCKET_DOCUMENTS, path);

    await supabase.from('compliance_doc').update({
      pdf_url: publicUrl,
      version: job.version || 1
    })
    .eq('job_id', job.id)
    .eq('type', 'WRD');

    return { publicUrl, dataUrl };
  } catch (error: any) {
    console.error('Error generating WRD:', error);
    throw new Error(error?.message || 'Failed to generate WRD document');
  }
}