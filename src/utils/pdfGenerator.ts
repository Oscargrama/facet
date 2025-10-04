/**
 * Generate contract PDF content as text
 * In production, use a proper PDF library like jsPDF or pdfmake
 */
export function generateContractPDF(contractData: any): string {
  const content = `
CONTRATO DE CRÉDITO

Fecha: ${new Date().toLocaleDateString()}
ID de Contrato: ${contractData.applicationId}-CONTRACT

PARTES:

Prestamista: Zentro Financial Services
123 Business Ave, Suite 100
New York, NY 10001
Tax ID: 12-3456789

Prestatario: ${contractData.customerName}
Email: ${contractData.customerEmail}
Teléfono: ${contractData.customerPhone || 'N/A'}

TÉRMINOS DEL PRÉSTAMO:

Monto Principal: $${contractData.creditAmount}
Tasa de Interés: ${contractData.interestRate}% APR
Plazo: ${contractData.termLength} meses
Pago Mensual: $${contractData.monthlyPayment}

Política de Pagos Tardíos: ${contractData.lateFeesPolicy}
Política de Pago Anticipado: ${contractData.earlyPaymentPolicy}

TÉRMINOS Y CONDICIONES:

1. Este acuerdo constituye el acuerdo completo entre las partes.
2. El prestatario acepta realizar los pagos a tiempo según lo especificado en este contrato.
3. El incumplimiento ocurre cuando el pago se retrasa más de 30 días.
4. Este acuerdo se rige por las leyes del estado de Nueva York.
5. Cualquier disputa se resolverá mediante arbitraje vinculante.

FIRMAS:

Prestamista: _______________________
Fecha: ${new Date().toLocaleDateString()}

Prestatario: _______________________
Fecha: ${new Date().toLocaleDateString()}
`;

  return content;
}

/**
 * Convert contract text to Blob for file operations
 */
export function contractToBlob(contractText: string): Blob {
  return new Blob([contractText], { type: 'text/plain' });
}

/**
 * Convert Blob to File
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}
