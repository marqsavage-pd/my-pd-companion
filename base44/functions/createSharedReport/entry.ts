import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Creates a time-limited shared report link. Returns a token that can be used
// with the public /shared/:token route to view a read-only clinic report.
const EXPIRY_DAYS = 7;

function generateToken() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const days = body.days || EXPIRY_DAYS;
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
    const token = generateToken();

    await base44.entities.SharedReport.create({ token, expires_at: expiresAt });

    return Response.json({ token, expires_at: expiresAt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}