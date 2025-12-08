import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type PdfField = { text: string; x: number; y: number; size?: number; page?: number };

export type FormFieldData = {
  textFields?: Record<string, string>;
  checkboxes?: Record<string, boolean>;
};

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
  let b64 = '';
  if (typeof window !== 'undefined') {
    let binary = '';
    for (let i = 0; i < out.length; i++) {
      binary += String.fromCharCode(out[i]);
    }
    b64 = btoa(binary);
  }
  const dataUrl = b64 ? `data:application/pdf;base64,${b64}` : '';
  return { bytes: out, dataUrl };
}

export async function fillPdfFormFields(templateUrl: string, formData: FormFieldData) {
  const resp = await fetch(templateUrl);
  const bytes = new Uint8Array(await resp.arrayBuffer());

  const pdf = await PDFDocument.load(bytes);
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

  const out = await pdf.save();
  let b64 = '';
  if (typeof window !== 'undefined') {
    let binary = '';
    for (let i = 0; i < out.length; i++) {
      binary += String.fromCharCode(out[i]);
    }
    b64 = btoa(binary);
  }
  const dataUrl = b64 ? `data:application/pdf;base64,${b64}` : '';
  return { bytes: out, dataUrl };
}