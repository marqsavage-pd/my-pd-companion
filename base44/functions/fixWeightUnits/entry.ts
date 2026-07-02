import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const vitalClient = base44.asServiceRole.entities.VitalSign;

    let allRecords = [];
    let hasMore = true;
    let skip = 0;
    const limit = 500;
    while (hasMore) {
      const batch = await vitalClient.list('-created_date', limit, skip);
      allRecords = allRecords.concat(batch);
      hasMore = batch.length === limit;
      skip += limit;
    }

    let updated = 0;
    const errors = [];

    for (const record of allRecords) {
      try {
        if (record.weight_kg == null) continue;
        const weightLbs = Math.round(record.weight_kg * 2.20462 * 10) / 10;
        await vitalClient.update(record.id, {
          weight_lbs: weightLbs,
          $unset: { weight_kg: "" }
        });
        updated++;
      } catch (err) {
        errors.push({ id: record.id, message: err?.message || String(err) });
      }
    }

    return Response.json({
      attempted: allRecords.length,
      updated,
      errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});