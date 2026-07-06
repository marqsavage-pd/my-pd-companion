import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_ENTITIES = ['Exchange', 'VitalSign', 'Symptom', 'JournalEntry', 'Supply'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { entity, updates, deletes } = body || {};

    if (!entity || typeof entity !== 'string') {
      return Response.json({ error: 'Missing or invalid "entity" field' }, { status: 400 });
    }
    if (!ALLOWED_ENTITIES.includes(entity)) {
      return Response.json({
        error: `Unsupported entity. Allowed: ${ALLOWED_ENTITIES.join(', ')}`
      }, { status: 400 });
    }
    if (!Array.isArray(updates) && !Array.isArray(deletes)) {
      return Response.json({ error: 'Either "updates" or "deletes" must be an array' }, { status: 400 });
    }

    const entityClient = base44.asServiceRole.entities[entity];
    if (!entityClient) {
      return Response.json({ error: `Entity "${entity}" not found` }, { status: 400 });
    }

    const errors = [];
    let succeeded = 0;

    if (Array.isArray(updates)) {
      for (let i = 0; i < updates.length; i++) {
        const item = updates[i];
        if (!item?.id || !item?.data) {
          errors.push({ index: i, message: 'Missing "id" or "data" in update item' });
          continue;
        }
        try {
          await entityClient.update(item.id, item.data);
          succeeded++;
        } catch (err) {
          errors.push({ index: i, id: item.id, message: err?.message || String(err) });
        }
      }

      return Response.json({
        entity,
        mode: 'update',
        attempted: updates.length,
        succeeded,
        errors
      });
    }

    for (let i = 0; i < deletes.length; i++) {
      const id = deletes[i];
      if (!id) {
        errors.push({ index: i, message: 'Missing id in deletes array' });
        continue;
      }
      try {
        await entityClient.delete(id);
        succeeded++;
      } catch (err) {
        errors.push({ index: i, id, message: err?.message || String(err) });
      }
    }

    return Response.json({
      entity,
      mode: 'delete',
      attempted: deletes.length,
      succeeded,
      errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});