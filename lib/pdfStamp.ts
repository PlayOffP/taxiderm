import { downloadBytes, looksLikePdf } from '@/lib/storageDownload';
import { BUCKET_TEMPLATES, BUCKET_DOCUMENTS, TEMPLATE_PSR, TEMPLATE_WRD } from '@/constants/storage';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ensureKioskSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { PsrField } from './psrMapping';
import type { FormFieldData } from './pdfFill';

export async function fillPSR(job: any, formData: FormFieldData) {
  await ensureKioskSession();

  const tplBytes = await downloadBytes(BUCKET_TEMPLATES, TEMPLATE_PSR);
  if (!looksLikePdf(tplBytes)) {
    console.error('Template is not a PDF. Check bucket name/file path:', BUCKET_TEMPLATES, TEMPLATE_PSR);
    throw new Error('Template is not a PDF');
  }

  const pdf = await PDFDocument.load(tplBytes);
  const form = pdf.getForm();

  if (formData.textFields) {
    Object.entries(formData.textFields).forEach(([fieldName, value]) => {
      try {
        const field = form.getTextField(fieldName);
        field.setText(value || '');
      } catch (e) {
        console.warn(`Text field not found: ${fieldName}`);
      }
    });
  }

  if (formData.checkboxes) {
    Object.entries(formData.checkboxes).forEach(([fieldName, checked]) => {
      try {
        const field = form.getCheckBox(fieldName);
        if (checked) {
          field.check();
        } else {
          field.uncheck();
        }
      } catch (e) {
        console.warn(`Checkbox not found: ${fieldName}`);
      }
    });
  }

  const bytes = await pdf.save();
  const b64 = typeof window !== 'undefined' ? btoa(String.fromCharCode(...bytes)) : '';
  const dataUrl = b64 ? `data:application/pdf;base64,${b64}` : '';

  const path = `${job.id}/PWD-535_v${job.version ?? 1}.pdf`;
  const { error } = await supabase.storage.from(BUCKET_DOCUMENTS).upload(path, bytes, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;

  const { data: pub } = supabase.storage.from(BUCKET_DOCUMENTS).getPublicUrl(path);
  const publicUrl = pub?.publicUrl ?? '';
  return { publicUrl, dataUrl };
}

export async function fillWRD(job: any, fields: PsrField[], opts?: { showGuides?: boolean }) {
  await ensureKioskSession();

  const tplBytes = await downloadBytes(BUCKET_TEMPLATES, TEMPLATE_WRD);
  if (!looksLikePdf(tplBytes)) {
    console.error('Template is not a PDF. Check bucket name/file path:', BUCKET_TEMPLATES, TEMPLATE_WRD);
    throw new Error('Template is not a PDF');
  }

  const pdf = await PDFDocument.load(tplBytes);
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (const f of fields) {
    const p = pages[f.page ?? 0];
    p.drawText(f.text ?? '', {
      x: f.x,
      y: f.y,
      size: f.size ?? 10,
      font,
      color: rgb(0, 0, 0),
    });
  }

  if (opts?.showGuides) {
    const p = pages[0];
    for (const f of fields) {
      p.drawRectangle({
        x: f.x - 2,
        y: f.y - 2,
        width: 184,
        height: 18,
        borderColor: rgb(1, 0, 0),
        borderWidth: 0.5,
        color: undefined,
      });
    }
    p.drawLine({ start: { x: 0, y: 0 }, end: { x: 30, y: 0 }, color: rgb(0, 0.2, 1), thickness: 0.5 });
    p.drawLine({ start: { x: 0, y: 0 }, end: { x: 0, y: 30 }, color: rgb(0, 0.2, 1), thickness: 0.5 });
  }

  const bytes = await pdf.save();
  const b64 = typeof window !== 'undefined' ? btoa(String.fromCharCode(...bytes)) : '';
  const dataUrl = b64 ? `data:application/pdf;base64,${b64}` : '';

  const path = `${job.id}/WRD_v${job.version ?? 1}.pdf`;
  const { error } = await supabase.storage.from(BUCKET_DOCUMENTS).upload(path, bytes, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;

  const { data: pub } = supabase.storage.from(BUCKET_DOCUMENTS).getPublicUrl(path);
  const publicUrl = pub?.publicUrl ?? '';
  return { publicUrl, dataUrl };
}