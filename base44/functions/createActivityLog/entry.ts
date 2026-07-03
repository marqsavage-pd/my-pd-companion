import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { api_key, title, description, type, created_date, source_id } = await req.json();
    if (api_key !== Deno.env.get("PD_COMPANION_API_KEY")) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const record = await base44.asServiceRole.entities.ActivityLog.create({
      title, description: description || '', type: type || 'note',
      source: 'nova', external_id: source_id, log_date: created_date
    });
    return Response.json({ id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});