import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const ids = ["6a45d54ab02a410889c6eded", "6a45d54a09071d81c2127c6f"];
    const results = [];
    for (const id of ids) {
      try {
        await base44.asServiceRole.entities.VitalSign.delete(id);
        results.push({ id, deleted: true });
      } catch (e) {
        results.push({ id, deleted: false, error: e.message });
      }
    }
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});