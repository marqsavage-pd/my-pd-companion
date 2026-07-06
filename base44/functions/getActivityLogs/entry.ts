import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { api_key } = await req.json();
    const expectedKey = Deno.env.get("PD_COMPANION_API_KEY");
    if (!expectedKey || api_key !== expectedKey) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const logs = await base44.asServiceRole.entities.ActivityLog.list('-created_date', 100);
    return Response.json({ logs: logs.map(l => ({
      id: l.id, title: l.title, description: l.description,
      type: l.type, created_date: l.created_date
    })) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});