import type { PdfField, FormFieldData } from './pdfFill';

/**
 * QUICK NOTE ABOUT COORDS:
 * pdf-lib uses bottom-left origin (0,0). You will tweak x,y to match your exact template.
 * Start rough, test-print, then nudge.
 */

export function mapPSRFormFields(job: any): FormFieldData {
  const textFields: Record<string, string> = {};
  const checkboxes: Record<string, boolean> = {};
  const radioButtons: Record<string, string> = {};

  textFields['hunter_name'] = job?.customer?.name ?? '';
  textFields['kill_date'] = job?.date_killed ?? '';
  textFields['invoice_number'] = job?.invoice_no ?? '';
  textFields['Date'] = new Date().toISOString().split('T')[0];

  const species = (job?.species ?? '').toLowerCase();
  const sex = (job?.sex ?? '').toLowerCase();

  if (species === 'deer') {
    if (sex === 'male') {
      radioButtons['Group4'] = 'antlered';
      textFields['deer_antlered_points'] = String(job?.antler_points ?? '');
    } else {
      radioButtons['Group4'] = 'antlerless';
    }
  }

  if (species === 'turkey') {
    if (sex === 'male') {
      radioButtons['Group6'] = 'turkey_gobbler';
      if (job?.beard_attached === true) {
        radioButtons['Group7'] = 'turkey_beard_attached_yes';
      } else {
        radioButtons['Group7'] = 'turkey_beard_attached_no';
      }
    } else {
      radioButtons['Group6'] = 'turkey_hen';
    }
  }

  if (species === 'pronghorn') {
    if (sex === 'male') {
      radioButtons['Group5'] = 'pronghorn_buck';
    } else {
      radioButtons['Group5'] = 'pronghorn_doe';
    }
  }

  if (species === 'pheasant') {
    if (sex === 'male') {
      radioButtons['Group8'] = 'pheasant_cock';
    } else {
      radioButtons['Group8'] = 'pheasant_hen';
    }
  }

  return { textFields, checkboxes, radioButtons };
}

export function mapPSR(job: any): PdfField[] {
  const f: PdfField[] = [];

  // Hunter name
  f.push({ text: job?.customer?.name || '', x: 110, y: 710, size: 12 });

  // Date killed (MM/DD/YYYY)
  f.push({ text: job?.date_killed || '', x: 420, y: 710, size: 12 });

  // Invoice #
  f.push({ text: job?.invoice_no || '', x: 420, y: 690, size: 12 });

  // Species / sex (example for Deer)
  if (job?.species === 'Deer') {
    const antlered = job?.sex === 'Antlered';
    // Checkbox ticks (estimate positions)
    f.push({ text: antlered ? 'X' : '', x: 95, y: 640, size: 14 });   // Deer Antlered
    f.push({ text: !antlered ? 'X' : '', x: 195, y: 640, size: 14 }); // Deer Antlerless
    if (antlered) f.push({ text: String(job?.antler_points ?? ''), x: 260, y: 640, size: 12 });
  }

  // Turkey beard attached (if applicable)
  if (job?.species === 'Turkey') {
    const beardYes = job?.beard_attached === true;
    f.push({ text: beardYes ? 'X' : '', x: 360, y: 600, size: 14 }); // Yes
    f.push({ text: !beardYes ? 'X' : '', x: 420, y: 600, size: 14 }); // No
  }

  // Business block (prefill your shop info)
  f.push({ text: job?.business_name || 'Tall Pine Taxidermy and Deer Processing', x: 120, y: 145, size: 12 });
  f.push({ text: job?.business_phone || '903-951-3548', x: 420, y: 145, size: 12 });
  f.push({ text: job?.business_address || '4982 TX-19 S, Sulphur Springs, TX 75482', x: 120, y: 125, size: 12 });

  // Signed date (use killed date as placeholder)
  f.push({ text: job?.date_signed || job?.date_killed || '', x: 420, y: 105, size: 12 });

  return f;
}

export function mapWRD(job: any): PdfField[] {
  const f: PdfField[] = [];

  // Donor (hunter)
  f.push({ text: job?.customer?.name || '',  x: 120, y: 710, size: 12 });
  f.push({ text: job?.customer?.phone || '', x: 420, y: 710, size: 12 });
  f.push({ text: job?.customer?.address_line1 || '', x: 120, y: 690, size: 12 });
  f.push({ text: `${job?.customer?.city || ''}, ${job?.customer?.state || ''} ${job?.customer?.zip || ''}`, x: 120, y: 670, size: 12 });

  // Receiver (shop)
  f.push({ text: job?.business_name || 'Tall Pine Taxidermy and Deer Processing', x: 120, y: 630, size: 12 });
  f.push({ text: job?.business_address || '4982 TX-19 S, Sulphur Springs, TX 75482', x: 120, y: 612, size: 12 });

  // Animal details
  f.push({ text: job?.species || '', x: 120, y: 570, size: 12 });
  f.push({ text: String(job?.quantity ?? 1), x: 420, y: 570, size: 12 });
  f.push({ text: job?.license_no || '', x: 120, y: 550, size: 12 });
  f.push({ text: job?.date_killed || '', x: 420, y: 550, size: 12 });

  // Processing type & instructions
  f.push({ text: job?.processing_type || 'Basic', x: 120, y: 510, size: 12 });
  f.push({ text: job?.instructions || '', x: 120, y: 490, size: 12 });

  // Weights
  if (job?.hang_weight)  f.push({ text: `Hang: ${job.hang_weight} lb`,  x: 120, y: 470, size: 12 });
  if (job?.yield_weight) f.push({ text: `Yield: ${job.yield_weight} lb`, x: 260, y: 470, size: 12 });

  return f;
}