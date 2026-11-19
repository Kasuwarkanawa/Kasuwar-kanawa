# First Super Admin setup

The database currently has no Super Admin account. The Edge API includes a one-time, secret-protected bootstrap endpoint.

## 1. Configure the one-time setup secret
In the Supabase Dashboard for project `efirbpzfimzmpchsovbz`, open **Project Settings → Edge Functions → Secrets** and add:

- Name: `BOOTSTRAP_ADMIN_TOKEN`
- Value: generate a random secret with at least 32 characters and keep it private.

Do not commit this token or send it in chat. It is not the Admin password.

## 2. Create the first Admin account
After the `api` Edge Function has been deployed, send a POST request to:

`https://efirbpzfimzmpchsovbz.supabase.co/functions/v1/api/auth/bootstrap-admin`

Headers:
- `apikey: <project publishable key>`
- `Content-Type: application/json`

JSON body:
```json
{
  "setupToken": "<BOOTSTRAP_ADMIN_TOKEN>",
  "fullName": "<ADMIN FULL NAME>",
  "email": "<ADMIN EMAIL>",
  "phone": "<ADMIN PHONE>",
  "password": "<STRONG PASSWORD OF AT LEAST 12 CHARACTERS>"
}
```

The endpoint hashes the password with bcrypt, creates an ACTIVE SUPER_ADMIN, and starts a session. The database function serializes concurrent setup attempts and refuses to create another first Admin once one exists.

The setup token and Admin password must be entered directly into your trusted request tool. Do not put either value in GitHub source, a public issue, or this document.
