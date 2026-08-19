import { Hono } from 'hono';
import { Bindings } from '../index';
import { protect, allowRoles } from '../middleware/auth';

const router = new Hono<{ Bindings: Bindings, Variables: { user: any } }>();

router.get('/subordinates', protect, async (c) => {
  try {
    const user = c.get('user');
    let results: any[] = [];

    if (user.roles.length === 1 && user.roles.includes('admin')) {
      const res = await c.env.DB.prepare(`SELECT id, name, email, roles, department, employee_id, reports_to FROM users WHERE roles LIKE '%"admin"%' AND roles LIKE '%"user"%' AND is_active = 1`).all();
      results = res.results;
    } else if (user.roles.includes('admin') && user.roles.includes('user')) {
      const res = await c.env.DB.prepare(`SELECT id, name, email, roles, department, employee_id, reports_to FROM users WHERE reports_to = ? AND roles NOT LIKE '%"admin"%' AND is_active = 1`)
        .bind(user.id).all();
      results = res.results;
    } else {
      return c.json({ message: 'Access denied' }, 403);
    }

    return c.json(results.map(u => ({ ...u, _id: u.id, role: JSON.parse(u.roles as string) })));
  } catch (err: any) {
    return c.json({ message: 'Failed to load subordinates' }, 500);
  }
});

router.get('/attendance-requests', protect, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM attendance_requests WHERE status = 'pending'`).all();
    return c.json(results.map(r => ({ ...r, _id: r.id, userId: r.user_id, requestedDate: r.requested_date })));
  } catch (err: any) {
    return c.json({ message: 'Failed to load attendance requests' }, 500);
  }
});

router.get('/leave-requests', protect, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM leave_requests WHERE status = 'pending'`).all();
    return c.json(results.map(r => ({ ...r, _id: r.id, userId: r.user_id, fromDate: r.from_date, toDate: r.to_date })));
  } catch (err: any) {
    return c.json({ message: 'Failed to load leave requests' }, 500);
  }
});

router.patch('/attendance/:id', protect, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { status } = await c.req.json();

    await c.env.DB.prepare(`UPDATE attendance_requests SET status = ?, reviewed_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(status, user.id, id).run();

    const updated = await c.env.DB.prepare(`SELECT * FROM attendance_requests WHERE id = ?`).bind(id).first();
    return c.json({ ...updated, _id: updated?.id });
  } catch (err: any) {
    return c.json({ message: 'Failed to update attendance request' }, 500);
  }
});

router.patch('/leave/:id', protect, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const { status } = await c.req.json();

    await c.env.DB.prepare(`UPDATE leave_requests SET status = ?, reviewed_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(status, user.id, id).run();

    const updated = await c.env.DB.prepare(`SELECT * FROM leave_requests WHERE id = ?`).bind(id).first();
    return c.json({ ...updated, _id: updated?.id });
  } catch (err: any) {
    return c.json({ message: 'Failed to update leave request' }, 500);
  }
});

router.get('/user-attendance/:id', protect, allowRoles('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const { results } = await c.env.DB.prepare(`SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC`).bind(id).all();
    return c.json(results.map(r => ({ ...r, _id: r.id, userId: r.user_id })));
  } catch (err: any) {
    return c.json({ message: 'Failed to load attendance' }, 500);
  }
});

export default router;
