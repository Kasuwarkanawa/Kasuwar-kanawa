import { env } from '../config/env.js';

const bucket = 'payment-receipts';

function config() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw Object.assign(new Error('Secure receipt storage is not configured.'), { statusCode: 503 });
  }
  return {
    base: `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1`,
    key: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export async function uploadPaymentReceipt(path: string, bytes: Buffer, contentType: string) {
  const { base, key } = config();
  const response = await fetch(`${base}/object/${bucket}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': contentType, 'x-upsert': 'true' },
    body: new Uint8Array(bytes),
  });
  if (!response.ok) throw Object.assign(new Error('Could not securely save payment receipt.'), { statusCode: 502 });
}

export async function createPaymentReceiptUrl(path: string) {
  const { base, key } = config();
  const response = await fetch(`${base}/object/sign/${bucket}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 300 }),
  });
  if (!response.ok) throw Object.assign(new Error('Could not open payment receipt.'), { statusCode: 502 });
  const data = await response.json() as { signedURL?: string };
  if (!data.signedURL) throw Object.assign(new Error('Storage did not return a secure receipt link.'), { statusCode: 502 });
  return data.signedURL.startsWith('http') ? data.signedURL : `${base}${data.signedURL}`;
}
