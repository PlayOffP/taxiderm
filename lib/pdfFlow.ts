import { supabase } from './supabase';
import { BUCKET_TEMPLATES, BUCKET_DOCUMENTS, TEMPLATE_PSR, TEMPLATE_WRD } from '../constants/storage';
import { fillPdfFromUrl, fillPdfFormFields } from './pdfFill';
import { mapPSR, mapWRD, mapPSRFormFields, mapWRDFormFields } from './pdfMapping';

function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

export async function generatePSR(job: any) {
  const tplUrl = getPublicUrl(BUCKET_TEMPLATES, TEMPLATE_PSR);
  const formData = mapPSRFormFields(job);
  const { bytes, dataUrl } = await fillPdfFormFields(tplUrl, formData);

  const path = `documents/${job.id}/PWD-535_v${job.version || 1}.pdf`;
  const { error } = await supabase.storage.from(BUCKET_DOCUMENTS)
    .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
  if (error) throw error;

  const publicUrl = getPublicUrl(BUCKET_DOCUMENTS, path);

  await supabase.from('compliance_doc').insert({
    job_id: job.id,
    type: 'PWD-535',
    pdf_url: publicUrl,
    version: job.version || 1
  });

  return { publicUrl, dataUrl };
}

export async function generateWRD(job: any) {
  const tplUrl = getPublicUrl(BUCKET_TEMPLATES, TEMPLATE_WRD);
  const formData = mapWRDFormFields(job);
  const { bytes, dataUrl } = await fillPdfFormFields(tplUrl, formData);

  const path = `documents/${job.id}/WRD_v${job.version || 1}.pdf`;
  const { error } = await supabase.storage.from(BUCKET_DOCUMENTS)
    .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
  if (error) throw error;

  const publicUrl = getPublicUrl(BUCKET_DOCUMENTS, path);

  await supabase.from('compliance_doc').insert({
    job_id: job.id,
    type: 'WRD',
    pdf_url: publicUrl,
    version: job.version || 1
  });

  return { publicUrl, dataUrl };
}