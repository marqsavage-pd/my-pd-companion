import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { gatherReportData } from '../../shared/reportData.ts';

// Public endpoint: validates a share token and returns the report data.
// No user auth required — the token IS the authentication.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { token } = body;
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });

    // Look up the shared report by token (service role bypasses RLS)
    const reports = await base44.asServiceRole.entities.SharedReport.filter({ token });
    if (!reports.length) return Response.json({ error: 'Invalid link' }, { status: 404 });
    const report = reports[0];

    if (new Date(report.expires_at) < new Date()) {
      return Response.json({ error: 'Link expired' }, { status: 410 });
    }

    // Gather the owner's report data using service role
    const data = await gatherReportData(base44, report.created_by_id, 30);

    // Fetch the owner's user info for the report header
    const users = await base44.asServiceRole.entities.User.filter({ id: report.created_by_id });
    const owner = users[0] || null;

    return Response.json({
      ...data,
      patient: owner ? { full_name: owner.full_name, email: owner.email } : null,
      expires_at: report.expires_at,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}