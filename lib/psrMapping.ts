import { FormFieldData } from './pdfFill';

export type PsrField = { text: string; x: number; y: number; size?: number; page?: number };

export function mapPSRFormFields(job: any): FormFieldData {
  const textFields: Record<string, string> = {};
  const checkboxes: Record<string, boolean> = {};

  textFields['hunter_name'] = job?.customer?.name ?? '';
  textFields['kill_date'] = job?.date_killed ?? '';
  textFields['invoice_number'] = job?.invoice_no ?? '';
  textFields['Date'] = new Date().toISOString().split('T')[0];

  const species = (job?.species ?? '').toLowerCase();
  const sex = (job?.sex ?? '').toLowerCase();

  if (species === 'deer') {
    if (sex === 'male') {
      checkboxes['antlered'] = true;
      checkboxes['antlerless'] = false;
      textFields['deer_antlered_points'] = String(job?.antler_points ?? '');
    } else {
      checkboxes['antlered'] = false;
      checkboxes['antlerless'] = true;
    }
  } else {
    checkboxes['antlered'] = false;
    checkboxes['antlerless'] = false;
  }

  if (species === 'turkey') {
    if (sex === 'male') {
      checkboxes['turkey_gobbler'] = true;
      checkboxes['turkey_hen'] = false;
      if (job?.beard_attached === true) {
        checkboxes['turkey_beard_attached_yes'] = true;
        checkboxes['turkey_beard_attached_no'] = false;
      } else {
        checkboxes['turkey_beard_attached_yes'] = false;
        checkboxes['turkey_beard_attached_no'] = true;
      }
    } else {
      checkboxes['turkey_gobbler'] = false;
      checkboxes['turkey_hen'] = true;
      checkboxes['turkey_beard_attached_yes'] = false;
      checkboxes['turkey_beard_attached_no'] = false;
    }
  } else {
    checkboxes['turkey_gobbler'] = false;
    checkboxes['turkey_hen'] = false;
    checkboxes['turkey_beard_attached_yes'] = false;
    checkboxes['turkey_beard_attached_no'] = false;
  }

  if (species === 'pronghorn') {
    if (sex === 'male') {
      checkboxes['pronghorn_buck'] = true;
      checkboxes['pronghorn_doe'] = false;
    } else {
      checkboxes['pronghorn_buck'] = false;
      checkboxes['pronghorn_doe'] = true;
    }
  } else {
    checkboxes['pronghorn_buck'] = false;
    checkboxes['pronghorn_doe'] = false;
  }

  if (species === 'pheasant') {
    if (sex === 'male') {
      checkboxes['pheasant_cock'] = true;
      checkboxes['pheasant_hen'] = false;
    } else {
      checkboxes['pheasant_cock'] = false;
      checkboxes['pheasant_hen'] = true;
    }
  } else {
    checkboxes['pheasant_cock'] = false;
    checkboxes['pheasant_hen'] = false;
  }

  return { textFields, checkboxes };
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