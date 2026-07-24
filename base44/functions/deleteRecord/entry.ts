import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This performs service-role deletes that bypass RLS, so restrict it to admins.
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { entity, id } = await req.json();
    if (!entity || !id) {
      return Response.json({ error: 'entity and id are required' }, { status: 400 });
    }

    const entityClient = base44.asServiceRole.entities[entity];
    if (!entityClient || typeof entityClient.delete !== 'function') {
      return Response.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    }

    await entityClient.delete(id);
    return Response.json({ success: true, entity, deleted_id: id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});