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

  // All radio buttons are in a single group "Group4"
  if (species === 'deer') {
    if (sex === 'male') {
      radioButtons['Group4'] = 'antlered';
      textFields['deer_antlered_points'] = String(job?.antler_points ?? '');
    } else {
      radioButtons['Group4'] = 'antlerless';
    }
  } else if (species === 'turkey') {
    if (sex === 'male') {
      radioButtons['Group4'] = 'turkey_gobbler';
    } else {
      radioButtons['Group4'] = 'turkey_hen';
    }
    // Turkey beard is a separate selection but needs to be handled differently
    // since it's in the same radio group - we'll prioritize the main species/sex selection
  } else if (species === 'pronghorn') {
    if (sex === 'male') {
      radioButtons['Group4'] = 'pronghorn_buck';
    } else {
      radioButtons['Group4'] = 'pronghorn_doe';
    }
  } else if (species === 'pheasant') {
    if (sex === 'male') {
      radioButtons['Group4'] = 'pheasant_cock';
    } else {
      radioButtons['Group4'] = 'pheasant_hen';
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

export function mapWRDFormFields(job: any): FormFieldData {
  const textFields: Record<string, string> = {};
  const checkboxes: Record<string, boolean> = {};
  const radioButtons: Record<string, string> = {};

  // Donor (hunter) information
  textFields['donor_name'] = job?.customer?.name ?? '';
  textFields['donor_phone'] = job?.customer?.phone ?? '';
  textFields['donor_address'] = job?.customer?.address_line1 ?? '';
  textFields['donor_city'] = job?.customer?.city ?? '';
  textFields['donor_state'] = job?.customer?.state ?? '';
  textFields['donor_zip'] = job?.customer?.zip ?? '';

  // Receiver (business) information
  textFields['receiver_name'] = 'Tall Pine Taxidermy and Deer Processing';
  textFields['receiver_address'] = '4982 TX-19 S, Sulphur Springs, TX 75482';

  // Animal details
  textFields['species'] = job?.species ?? '';
  textFields['quantity'] = String(job?.quantity ?? 1);
  textFields['license_number'] = job?.license_no ?? '';
  textFields['kill_date'] = job?.date_killed ?? '';

  // Processing information
  textFields['processing_type'] = job?.processing_type ?? 'Basic';
  textFields['instructions'] = job?.instructions ?? '';

  // Weights
  if (job?.hang_weight) {
    textFields['hang_weight'] = String(job.hang_weight);
  }
  if (job?.yield_weight) {
    textFields['yield_weight'] = String(job.yield_weight);
  }

  // Current date
  textFields['date'] = new Date().toISOString().split('T')[0];

  return { textFields, checkboxes, radioButtons };
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