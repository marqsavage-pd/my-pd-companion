import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALLOWED_ENTITIES = ['Exchange', 'VitalSign', 'Symptom', 'JournalEntry'];

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

    const { entity, records } = body || {};

    if (!entity || typeof entity !== 'string') {
      return Response.json({ error: 'Missing or invalid "entity" field' }, { status: 400 });
    }
    if (!ALLOWED_ENTITIES.includes(entity)) {
      return Response.json({
        error: `Unsupported entity. Allowed: ${ALLOWED_ENTITIES.join(', ')}`
      }, { status: 400 });
    }
    if (!Array.isArray(records)) {
      return Response.json({ error: '"records" must be an array' }, { status: 400 });
    }

    const entityClient = base44.asServiceRole.entities[entity];
    if (!entityClient) {
      return Response.json({ error: `Entity "${entity}" not found` }, { status: 400 });
    }

    let created = 0;
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      try {
        await entityClient.create(records[i]);
        created++;
      } catch (err) {
        errors.push({ index: i, message: err?.message || String(err) });
      }
    }

    return Response.json({
      entity,
      attempted: records.length,
      created,
      errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});