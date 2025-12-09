import { FormFieldData } from './pdfFill';

export type PsrField = { text: string; x: number; y: number; size?: number; page?: number };

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

  // Group4: Deer (Antlered/Antlerless)
  if (species === 'deer') {
    radioButtons['Group4'] = sex === 'male' ? 'antlered' : 'antlerless';
    if (sex === 'male') {
      textFields['deer_antlered_points'] = String(job?.antler_points ?? '');
    }
  }

  // Group5: Pronghorn (pronghorn_buck/pronghorn_doe)
  if (species === 'pronghorn') {
    radioButtons['Group5'] = sex === 'male' ? 'pronghorn_buck' : 'pronghorn_doe';
  }

  // Group6: Turkey (turkey_gobbler/turkey_hen)
  if (species === 'turkey') {
    radioButtons['Group6'] = sex === 'male' ? 'turkey_gobbler' : 'turkey_hen';
    // Group7: Beard attached (turkey_beard_attached_yes/turkey_beard_attached_no)
    if (sex === 'male') {
      radioButtons['Group7'] = job?.beard_attached === true ? 'turkey_beard_attached_yes' : 'turkey_beard_attached_no';
    }
  }

  // Group8: Pheasant (pheasant_cock/pheasant_hen)
  if (species === 'pheasant') {
    radioButtons['Group8'] = sex === 'male' ? 'pheasant_cock' : 'pheasant_hen';
  }

  return { textFields, checkboxes, radioButtons };
}

export function mapWRDFormFields(job: any): FormFieldData {
  const textFields: Record<string, string> = {};
  const checkboxes: Record<string, boolean> = {};
  const radioButtons: Record<string, string> = {};

  // Hunter/Customer Information
  textFields['hunter_name'] = job?.customer?.name ?? '';
  textFields['hunter_phone'] = job?.customer?.phone ?? '';
  textFields['hunter_address'] = job?.customer?.address_line1 ?? '';
  textFields['hunter_city'] = job?.customer?.city ?? '';
  textFields['hunter_state'] = job?.customer?.state ?? 'TX';
  textFields['hunter_zip'] = job?.customer?.zip ?? '';

  // Kill date and location information
  textFields['kill_date'] = job?.date_killed ?? '';
  textFields['ranch_name'] = job?.ranch_area ?? '';

  // Ranch address - combine county and state if available
  const ranchAddress = [job?.county, job?.state]
    .filter(Boolean)
    .join(', ');
  textFields['ranch_address'] = ranchAddress || '';

  // License information
  textFields['hunter_license'] = job?.license_no ?? '';
  textFields['hunter_license_state'] = job?.state ?? 'TX';

  // Processing type checkboxes
  const processingType = (job?.processing_type ?? 'standard').toLowerCase();

  // Map processing types to checkboxes
  if (processingType === 'standard' || processingType === 'processing_only') {
    checkboxes['BasicProcessing_checkbox'] = true;
  }

  // Check if quartered deer processing is selected in cut sheet
  if (job?.cut_sheet?.quartered) {
    checkboxes['QuarteredDeer_checkbox'] = true;
  }

  // Check for other/custom processing types
  if (processingType === 'euro_mount' || processingType === 'shoulder_mount' || processingType === 'full_mount') {
    checkboxes['Other_checkbox'] = true;
  }

  // Special instructions
  textFields['instructions'] = job?.instructions ?? '';

  return { textFields, checkboxes, radioButtons };
}

export function mapPSR(job: any): PsrField[] {
  const f: PsrField[] = [];

  // --- HUNTER / CUSTOMER ---
  f.push({ text: job?.customer?.name ?? '',            x: 120, y: 708, size: 11 });
  f.push({ text: job?.customer?.phone ?? '',           x: 420, y: 708, size: 11 });
  f.push({ text: job?.customer?.email ?? '',           x: 120, y: 690, size: 11 });
  f.push({ text: job?.customer?.address_line1 ?? '',   x: 120, y: 672, size: 11 });
  f.push({ text: `${job?.customer?.city ?? ''}, ${job?.customer?.state ?? ''} ${job?.customer?.zip ?? ''}`, x: 120, y: 654, size: 11 });

  // --- ANIMAL DETAILS ---
  f.push({ text: job?.species ?? '',      x: 120, y: 628, size: 11 });
  f.push({ text: job?.sex ?? '',          x: 260, y: 628, size: 11 });
  f.push({ text: String(job?.antler_points ?? ''), x: 420, y: 628, size: 11 });

  // Dates / license
  f.push({ text: job?.date_killed ?? '',  x: 120, y: 602, size: 11 });
  f.push({ text: job?.license_no ?? '',   x: 260, y: 602, size: 11 });
  f.push({ text: job?.county ?? '',       x: 120, y: 584, size: 11 });
  f.push({ text: job?.state ?? 'TX',      x: 260, y: 584, size: 11 });

  // --- BUSINESS (RECEIVER) ---
  f.push({ text: job?.business_name   ?? 'Tall Pine Taxidermy and Deer Processing', x: 120, y: 160, size: 11 });
  f.push({ text: job?.business_phone  ?? '903-951-3548',                            x: 420, y: 160, size: 11 });
  f.push({ text: job?.business_address?? '4982 TX-19 S, Sulphur Springs, TX 75482', x: 120, y: 142, size: 11 });
  f.push({ text: job?.date_signed ?? job?.date_killed ?? '',                         x: 420, y: 124, size: 11 });

  // Optional extra fields you may want to surface
  if (job?.invoice_no) f.push({ text: `Invoice: ${job.invoice_no}`, x: 420, y: 670, size: 10 });

  return f;
}

export function mapWRD(job: any): PsrField[] {
  const f: PsrField[] = [];

  // Donor (hunter)
  f.push({ text: job?.customer?.name ?? '',  x: 120, y: 710, size: 11 });
  f.push({ text: job?.customer?.phone ?? '', x: 420, y: 710, size: 11 });
  f.push({ text: job?.customer?.address_line1 ?? '', x: 120, y: 690, size: 11 });
  f.push({ text: `${job?.customer?.city ?? ''}, ${job?.customer?.state ?? ''} ${job?.customer?.zip ?? ''}`, x: 120, y: 670, size: 11 });

  // Receiver (shop)
  f.push({ text: job?.business_name ?? 'Tall Pine Taxidermy and Deer Processing', x: 120, y: 630, size: 11 });
  f.push({ text: job?.business_address ?? '4982 TX-19 S, Sulphur Springs, TX 75482', x: 120, y: 612, size: 11 });

  // Animal details
  f.push({ text: job?.species ?? '', x: 120, y: 570, size: 11 });
  f.push({ text: String(job?.quantity ?? 1), x: 420, y: 570, size: 11 });
  f.push({ text: job?.license_no ?? '', x: 120, y: 550, size: 11 });
  f.push({ text: job?.date_killed ?? '', x: 420, y: 550, size: 11 });

  // Processing type & instructions
  f.push({ text: job?.processing_type ?? 'standard', x: 120, y: 510, size: 11 });
  f.push({ text: job?.instructions ?? '', x: 120, y: 490, size: 11 });

  // Weights
  if (job?.hang_weight)  f.push({ text: `Hang: ${job.hang_weight} lb`,  x: 120, y: 470, size: 11 });
  if (job?.yield_weight) f.push({ text: `Yield: ${job.yield_weight} lb`, x: 260, y: 470, size: 11 });

  return f;
}

export function mapPSRGuides(fields: PsrField[], w = 180, h = 14) {
  return fields.map(f => ({ ...f, w, h }));
}