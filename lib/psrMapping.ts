export type PsrField = { text: string; x: number; y: number; size?: number; page?: number };

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

/** Boxes around mapped fields for one-time calibration */
export function mapPSRGuides(fields: PsrField[], w = 180, h = 14) {
  return fields.map(f => ({ ...f, w, h }));
}