export const demoComplaintText = `Subject: Out of specification appearance observed in Metformin HCl API batch MTF-240816
Customer: Helix Formulations Pvt. Ltd.
Email: quality@helixformulations.com
Product: Metformin Hydrochloride API, USP
Strength: 500 mg
Batch: MTF-240816
Manufactured: 2024-08-16
Expiry: 2026-08-15
Complaint date: 2024-09-04
Quantity affected: 12 drums
The customer reports grey particles and visible discoloration in the API during dispensing. Retain sample review is requested. This may impact product quality and requires prompt investigation.`

export const demoComplaintFields = {
  source: 'Email', customerName: 'Helix Formulations Pvt. Ltd.', customerEmail: 'quality@helixformulations.com',
  productName: 'Metformin Hydrochloride API, USP', productType: 'API', strength: '500 mg', batchNumber: 'MTF-240816',
  manufacturingDate: '2024-08-16', expiryDate: '2026-08-15', quantity: '12 drums', complaintType: 'Appearance',
  complaintDate: '2024-09-04', description: 'Customer reports grey particles and visible discoloration in the API during dispensing. Retain sample review is requested.',
  initialSeverity: 'High', priority: 'High'
}
