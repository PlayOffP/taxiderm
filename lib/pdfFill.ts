import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type PdfField = { text: string; x: number; y: number; size?: number; page?: number };

export async function fillPdfFromUrl(templateUrl: string, fields: PdfField[]) {
  const resp = await fetch(templateUrl);
  const bytes = new Uint8Array(await resp.arrayBuffer());

  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  fields.forEach(({ text, x, y, size = 10, page = 0 }) => {
    const p = pages[page];
    p.drawText(text ?? '', { x, y, size, font, color: rgb(0, 0, 0) });
  });

  const out = await pdf.save();
  const b64 = typeof window !== 'undefined' ? btoa(String.fromCharCode(...out)) : '';
  const dataUrl = b64 ? `data:application/pdf;base64,${b64}` : '';
  return { bytes: out, dataUrl };
}