import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import { OtpChannel } from '@prisma/client';
import { env } from '../config/env.js';

function digest(email: string, phone: string, channel: OtpChannel, code: string) {
  return createHmac('sha256', env.OTP_HMAC_SECRET).update(`${email}|${phone}|${channel}|${code}`).digest('hex');
}
export const generateOtp = () => randomInt(0, 1_000_000).toString().padStart(6, '0');
export const hashOtp = digest;
export function verifyOtp(email: string, phone: string, channel: OtpChannel, code: string, expected: string) {
  const actual = Buffer.from(digest(email, phone, channel, code)); const stored = Buffer.from(expected);
  return actual.length === stored.length && timingSafeEqual(actual, stored);
}
export async function sendOtp(channel: OtpChannel, recipient: string, code: string) {
  if (channel === OtpChannel.EMAIL) {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) throw Object.assign(new Error('Email OTP delivery is not configured. Configure SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM.'), { statusCode: 503 });
    const transporter = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE === 'true', auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } });
    await transporter.sendMail({ from: env.SMTP_FROM, to: recipient, subject: 'Kasuwar Kanawa verification code', text: `Your verification code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes. Do not share it.` });
    return;
  }
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) throw Object.assign(new Error('SMS OTP delivery is not configured. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM.'), { statusCode: 503 });
  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const body = new URLSearchParams({ To: recipient, From: env.TWILIO_FROM, Body: `Kasuwar Kanawa verification code: ${code}. Expires in ${env.OTP_TTL_MINUTES} minutes.` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw Object.assign(new Error('SMS provider rejected the OTP delivery request.'), { statusCode: 502 });
}
