/**
 * ZATCA Phase 1 ("Generation Phase") simplified-invoice QR code payload.
 * TLV (Tag-Length-Value) encoding, base64'd — this part of e-invoicing is
 * fully self-contained and needs no ZATCA credentials/API access, unlike
 * Phase 2 clearance/reporting (see PROJECT_MAP.md §2.1 and §12, which DO
 * require onboarding with the authority).
 *
 * Tags: 1=seller name, 2=VAT number, 3=timestamp (ISO 8601), 4=invoice total
 * (incl. VAT), 5=VAT amount.
 */
export interface ZatcaQrInput {
  sellerName: string;
  vatNumber: string;
  timestamp: Date;
  invoiceTotal: number;
  vatAmount: number;
}

function tlv(tag: number, value: string): Buffer {
  const valueBuffer = Buffer.from(value, 'utf-8');
  return Buffer.concat([Buffer.from([tag, valueBuffer.length]), valueBuffer]);
}

export function buildZatcaQrPayload(input: ZatcaQrInput): string {
  const fields = [
    tlv(1, input.sellerName),
    tlv(2, input.vatNumber),
    tlv(3, input.timestamp.toISOString()),
    tlv(4, input.invoiceTotal.toFixed(2)),
    tlv(5, input.vatAmount.toFixed(2)),
  ];
  return Buffer.concat(fields).toString('base64');
}
