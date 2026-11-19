# Private payment receipt storage setup

The backend uses Supabase Storage's REST API from the server. Receipt objects are private; the service-role key must never be placed in frontend code or committed to Git.

## Supabase dashboard

1. Open the Supabase project used by Kasuwar Kanawa.
2. Go to Storage and create a bucket named `payment-receipts`.
3. Keep **Public bucket** turned OFF.
4. Set the file size limit to 5 MB. Allow only `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`.
5. Do not create public read policies. The backend service role uploads objects and generates five-minute signed URLs for Super Admin only.

## Backend environment variables

Set these in the backend hosting provider's secret/environment settings:

- `SUPABASE_URL`: project URL, for example `https://<project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: service-role secret from Supabase API settings

Never send these values in chat, add them to Vite variables, or commit them to GitHub. Rotate the service-role key immediately if it has been exposed.

## API contract

- Buyer uploads raw file bytes to `POST /api/orders/:id/payment-receipt` with the file MIME type as Content-Type. Maximum 5 MB.
- Admin obtains a short-lived receipt link from `GET /api/orders/admin/:id/payment-receipt`.
- Admin approves/rejects COD orders through `PATCH /api/orders/admin/:id/cod-approval` with `{ "decision": "approve" }` or `{ "decision": "reject", "adminNotes": "..." }`.
- OPay Admin verification now requires a receipt object path saved by the upload endpoint.
- Seller fulfillment is blocked until OPay verification or COD Admin approval.

The receipt path and verification metadata are stored in the existing Order.paymentConfirmation JSON field. This avoids a destructive schema change and preserves existing orders.

## Deployment caution

Create the private bucket and set the two backend secrets before enabling receipt uploads. The repository changes add backend endpoints; the Buyer, Seller, and Admin React screens still need to be connected to these API endpoints before the complete user-facing workflow is live. Run backend typecheck/tests and a real end-to-end test before production rollout.
