import * as Print from 'expo-print';
import { JobRow, CustomerRow, ComplianceDocRow } from '@/types/database';

type JobWithCustomer = JobRow & {
  customer: CustomerRow;
};

export async function generatePWD535PDF(job: JobWithCustomer): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>PWD-535 Proof of Sex Receipt</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .subtitle {
          font-size: 14px;
          color: #666;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .field-row {
          display: flex;
          margin-bottom: 8px;
        }
        .field-label {
          font-weight: bold;
          width: 150px;
          display: inline-block;
        }
        .field-value {
          flex: 1;
        }
        .signature-section {
          margin-top: 40px;
          border-top: 1px solid #ccc;
          padding-top: 20px;
        }
        .signature-line {
          border-bottom: 1px solid #000;
          width: 300px;
          height: 40px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">PWD-535 PROOF OF SEX RECEIPT</div>
        <div class="subtitle">Texas Parks and Wildlife Department</div>
      </div>

      <div class="section">
        <div class="section-title">Hunter Information</div>
        <div class="field-row">
          <span class="field-label">Name:</span>
          <span class="field-value">${job.customer.name}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Phone:</span>
          <span class="field-value">${job.customer.phone}</span>
        </div>
        ${job.customer.email ? `
        <div class="field-row">
          <span class="field-label">Email:</span>
          <span class="field-value">${job.customer.email}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Animal Information</div>
        <div class="field-row">
          <span class="field-label">Species:</span>
          <span class="field-value">${job.species.charAt(0).toUpperCase() + job.species.slice(1)}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Sex:</span>
          <span class="field-value">${job.sex.charAt(0).toUpperCase() + job.sex.slice(1)}</span>
        </div>
        ${job.antler_points ? `
        <div class="field-row">
          <span class="field-label">Antler Points:</span>
          <span class="field-value">${job.antler_points}</span>
        </div>
        ` : ''}
        ${job.beard_attached !== null ? `
        <div class="field-row">
          <span class="field-label">Beard Attached:</span>
          <span class="field-value">${job.beard_attached ? 'Yes' : 'No'}</span>
        </div>
        ` : ''}
        <div class="field-row">
          <span class="field-label">Date Killed:</span>
          <span class="field-value">${new Date(job.date_killed).toLocaleDateString()}</span>
        </div>
        <div class="field-row">
          <span class="field-label">License Number:</span>
          <span class="field-value">${job.license_no}</span>
        </div>
        ${job.ranch_area ? `
        <div class="field-row">
          <span class="field-label">Ranch/Area:</span>
          <span class="field-value">${job.ranch_area}</span>
        </div>
        ` : ''}
        <div class="field-row">
          <span class="field-label">County:</span>
          <span class="field-value">${job.county || 'Not specified'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">State:</span>
          <span class="field-value">${job.state || 'TX'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Processing Information</div>
        <div class="field-row">
          <span class="field-label">Invoice Number:</span>
          <span class="field-value">${job.invoice_no}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Processing Type:</span>
          <span class="field-value">${job.processing_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date Received:</span>
          <span class="field-value">${new Date(job.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div class="signature-section">
        <div class="section-title">Signatures</div>
        <div style="display: flex; justify-content: space-between;">
          <div>
            <div>Hunter Signature:</div>
            <div class="signature-line"></div>
            <div>Date: _______________</div>
          </div>
          <div>
            <div>Taxidermist Signature:</div>
            <div class="signature-line"></div>
            <div>Date: _______________</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Tall Pine Taxidermy & Deer Processing</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

export async function generateWRDPDF(job: JobWithCustomer): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Wildlife Resource Document</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .subtitle {
          font-size: 14px;
          color: #666;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .field-row {
          display: flex;
          margin-bottom: 8px;
        }
        .field-label {
          font-weight: bold;
          width: 150px;
          display: inline-block;
        }
        .field-value {
          flex: 1;
        }
        .business-info {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 40px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">WILDLIFE RESOURCE DOCUMENT</div>
        <div class="subtitle">Taxidermy & Processing Record</div>
      </div>

      <div class="business-info">
        <div class="section-title">Business Information</div>
        <div class="field-row">
          <span class="field-label">Business Name:</span>
          <span class="field-value">Tall Pine Taxidermy & Deer Processing</span>
        </div>
        <div class="field-row">
          <span class="field-label">Address:</span>
          <span class="field-value">123 Pine St, Texas 75001</span>
        </div>
        <div class="field-row">
          <span class="field-label">Phone:</span>
          <span class="field-value">(555) 123-4567</span>
        </div>
        <div class="field-row">
          <span class="field-label">Taxidermist:</span>
          <span class="field-value">Tristan</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Client Information</div>
        <div class="field-row">
          <span class="field-label">Name:</span>
          <span class="field-value">${job.customer.name}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Phone:</span>
          <span class="field-value">${job.customer.phone}</span>
        </div>
        ${job.customer.address_line1 ? `
        <div class="field-row">
          <span class="field-label">Address:</span>
          <span class="field-value">${job.customer.address_line1}${job.customer.city ? ', ' + job.customer.city : ''}${job.customer.state ? ', ' + job.customer.state : ''}${job.customer.zip ? ' ' + job.customer.zip : ''}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Wildlife Information</div>
        <div class="field-row">
          <span class="field-label">Species:</span>
          <span class="field-value">${job.species.charAt(0).toUpperCase() + job.species.slice(1)}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Sex:</span>
          <span class="field-value">${job.sex.charAt(0).toUpperCase() + job.sex.slice(1)}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date Harvested:</span>
          <span class="field-value">${new Date(job.date_killed).toLocaleDateString()}</span>
        </div>
        <div class="field-row">
          <span class="field-label">License/Tag Number:</span>
          <span class="field-value">${job.license_no}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Harvest Location:</span>
          <span class="field-value">${[job.ranch_area, job.county, job.state].filter(Boolean).join(', ') || 'Not specified'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Service Details</div>
        <div class="field-row">
          <span class="field-label">Invoice Number:</span>
          <span class="field-value">${job.invoice_no}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Service Type:</span>
          <span class="field-value">${job.processing_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Date Received:</span>
          <span class="field-value">${new Date(job.created_at).toLocaleDateString()}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Status:</span>
          <span class="field-value">${job.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </div>
        ${job.instructions ? `
        <div class="field-row">
          <span class="field-label">Special Instructions:</span>
          <span class="field-value">${job.instructions}</span>
        </div>
        ` : ''}
      </div>

      <div class="footer">
        <p>This document certifies the receipt and processing of the above wildlife resource.</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}