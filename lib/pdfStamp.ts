import { downloadBytes, looksLikePdf } from '@/lib/storageDownload';
import { BUCKET_TEMPLATES, BUCKET_DOCUMENTS, TEMPLATE_PSR } from '@/constants/storage';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ensureKioskSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { PsrField } from './psrMapping';

export async function fillPSR(job: any, fields: PsrField[], opts?: { showGuides?: boolean }) {
  // Ensure kiosk session exists before uploading
  await ensureKioskSession();
  
  // Optional debug - check if we have a valid user
  const { data: u } = await supabase.auth.getUser();
  console.log('kiosk uid:', u?.user?.id);

  // RLS smoke test
  const blob = new Blob(['ok'], { type: 'text/plain' });
  const { error: upErr } = await supabase.storage
    .from('documents')
    .upload('rls-test.txt', blob, { upsert: true });
  console.log('rls test upload error:', upErr);

  // 1) Download template bytes
  const tplBytes = await downloadBytes(BUCKET_TEMPLATES, TEMPLATE_PSR);
  if (!looksLikePdf(tplBytes)) {
    console.error('Template is not a PDF. Check bucket name/file path:', BUCKET_TEMPLATES, TEMPLATE_PSR, 'Bytes[0..7]=', Array.from(tplBytes.slice(0,8)));
    throw new Error('Template is not a PDF');
  }

  const pdf = await PDFDocument.load(tplBytes);

  // 2) Load and draw
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

  // Optional: draw visual guides for first calibration pass
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

    // small origin crosshair (0,0 is bottom-left)
    p.drawLine({ start: { x: 0, y: 0 }, end: { x: 30, y: 0 }, color: rgb(0, 0.2, 1), thickness: 0.5 });
    p.drawLine({ start: { x: 0, y: 0 }, end: { x: 0, y: 30 }, color: rgb(0, 0.2, 1), thickness: 0.5 });
  }

  // 3) Output
  const bytes = await pdf.save();

  // Data URL preview for web viewer
  const b64 = typeof window !== 'undefined' ? btoa(String.fromCharCode(...bytes)) : '';
  const dataUrl = b64 ? `data:application/pdf;base64,${b64}` : '';

  // 4) Upload to documents bucket
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