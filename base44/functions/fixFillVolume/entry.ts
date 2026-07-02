import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const exchangeClient = base44.asServiceRole.entities.Exchange;

    let allRecords = [];
    let hasMore = true;
    let skip = 0;
    const limit = 500;
    while (hasMore) {
      const batch = await exchangeClient.list('-created_date', limit, skip);
      allRecords = allRecords.concat(batch);
      hasMore = batch.length === limit;
      skip += limit;
    }

    let updated = 0;
    const errors = [];

    for (const record of allRecords) {
      try {
        const update = { fill_volume: 2300 };
        if (record.ultrafiltration != null) {
          update.drain_volume = 2300 + record.ultrafiltration;
        }
        await exchangeClient.update(record.id, update);
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