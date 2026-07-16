import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { api_key, title, description, type, created_date, source_id, user_id } = await req.json();
    const expectedKey = Deno.env.get("PD_COMPANION_API_KEY");
    if (!expectedKey || api_key !== expectedKey) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user_id) {
      return Response.json({ error: 'user_id is required' }, { status: 400 });
    }
    const record = await base44.asServiceRole.entities.ActivityLog.create({
      title, description: description || '', type: type || 'note',
      source: 'nova', external_id: source_id, log_date: created_date,
      owner_id: user_id
    });
    return Response.json({ id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});