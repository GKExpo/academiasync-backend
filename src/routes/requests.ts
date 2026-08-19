import { Hono } from 'hono';
import { Bindings } from '../index';
import { protect, allowRoles } from '../middleware/auth';

const router = new Hono<{ Bindings: Bindings, Variables: { user: any } }>();

router.post('/attendance', protect, allowRoles('user'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { attendanceId, requestedDate, requestedCheckIn, requestedCheckOut, reason } = body;

    if (!requestedDate || !reason) {
      return c.json({ message: 'Missing required fields' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO attendance_requests (id, attendance_id, user_id, requested_date, requested_check_in, requested_check_out, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, attendanceId || null, user.id, requestedDate, requestedCheckIn, requestedCheckOut, reason, 'pending').run();

    const record = await c.env.DB.prepare('SELECT * FROM attendance_requests WHERE id = ?').bind(id).first();
    return c.json({ ...record, _id: record?.id, userId: record?.user_id }, 201);
  } catch (err: any) {
    return c.json({ message: 'Failed to create request' }, 500);
  }
});

router.post('/leave', protect, allowRoles('user', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { fromDate, toDate, reason } = body;

    if (!fromDate || !toDate || !reason) {
      return c.json({ message: 'All fields are required' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO leave_requests (id, user_id, from_date, to_date, reason, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, user.id, fromDate, toDate, reason, 'pending').run();

    const record = await c.env.DB.prepare('SELECT * FROM leave_requests WHERE id = ?').bind(id).first();
    return c.json({ ...record, _id: record?.id, user: record?.user_id }, 201);
  } catch (err: any) {
    return c.json({ message: 'Failed to apply leave' }, 500);
  }
});

router.get('/pending', protect, allowRoles('admin'), async (c) => {
  try {
    const user = c.get('user');
    let subordinateIds: string[] = [];

    if (user.roles.length === 1 && user.roles.includes('admin')) {
      // Principal sees HODs
      const { results } = await c.env.DB.prepare('SELECT id FROM users WHERE roles LIKE ? AND id != ? AND is_active = 1')
        .bind('%"admin"%', user.id).all();
      subordinateIds = results.map(r => r.id as string);
    } else if (user.roles.includes('admin') && user.roles.includes('user')) {
      // HOD sees Staff
      const { results } = await c.env.DB.prepare('SELECT id FROM users WHERE reports_to = ? AND is_active = 1')
        .bind(user.id).all();
      subordinateIds = results.map(r => r.id as string);
    }

    if (subordinateIds.length === 0) {
      return c.json({ attendance: [], leave: [] });
    }

    const placeholders = subordinateIds.map(() => '?').join(',');
    
    const attResults = await c.env.DB.prepare(`SELECT * FROM attendance_requests WHERE status = 'pending' AND user_id IN (${placeholders})`)
      .bind(...subordinateIds).all();
      
    const leaveResults = await c.env.DB.prepare(`SELECT * FROM leave_requests WHERE status = 'pending' AND user_id IN (${placeholders})`)
      .bind(...subordinateIds).all();

    // Map records to match frontend expectations
    const attendance = attResults.results.map(r => ({ ...r, _id: r.id, userId: r.user_id, requestedDate: r.requested_date, requestedCheckIn: r.requested_check_in, requestedCheckOut: r.requested_check_out }));
    const leave = leaveResults.results.map(r => ({ ...r, _id: r.id, user: r.user_id, fromDate: r.from_date, toDate: r.to_date }));

    return c.json({ attendance, leave });
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

router.patch('/leave/:id', protect, allowRoles('admin'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { status } = await c.req.json();

    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ message: 'Invalid status value' }, 400);
    }

    const request = await c.env.DB.prepare('SELECT * FROM leave_requests WHERE id = ?').bind(id).first();
    if (!request) {
      return c.json({ message: 'Request not found' }, 404);
    }

    await c.env.DB.prepare('UPDATE leave_requests SET status = ?, reviewed_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(status, user.id, id).run();

    await c.env.DB.prepare('INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), request.user_id, status === 'approved' ? 'Leave Approved' : 'Leave Rejected', `Your leave from ${request.from_date} to ${request.to_date} was ${status}`, 'leave')
      .run();

    if (status === 'approved') {
      let start = new Date(request.from_date as string);
      let end = new Date(request.to_date as string);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Upsert logic for SQLite
        await c.env.DB.prepare(`
          INSERT INTO attendance (id, user_id, date, status) 
          VALUES (?, ?, ?, 'leave')
          ON CONFLICT(user_id, date) DO UPDATE SET status = 'leave', updated_at = CURRENT_TIMESTAMP
        `).bind(crypto.randomUUID(), request.user_id, dateStr).run();
      }
    }

    const updated = await c.env.DB.prepare('SELECT * FROM leave_requests WHERE id = ?').bind(id).first();
    return c.json({ ...updated, _id: updated?.id, user: updated?.user_id, fromDate: updated?.from_date, toDate: updated?.to_date });
  } catch (err: any) {
    return c.json({ message: 'Failed to update leave request' }, 500);
  }
});

export default router;
