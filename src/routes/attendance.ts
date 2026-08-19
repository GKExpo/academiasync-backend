import { Hono } from 'hono';
import { Bindings } from '../index';
import { protect, allowRoles } from '../middleware/auth';

const router = new Hono<{ Bindings: Bindings, Variables: { user: any } }>();

const getLocalDateString = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const getLocalTimeString = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

router.post('/check-in', protect, allowRoles('staff', 'hod', 'principal'), async (c) => {

  try {
    const user = c.get('user');
    const date = getLocalDateString();
    const time = getLocalTimeString();

    const existing = await c.env.DB.prepare('SELECT id FROM attendance WHERE user_id = ? AND date = ?').bind(user.id, date).first();
    if (existing) {
      return c.json({ message: 'Already checked in' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO attendance (id, user_id, date, check_in, status, source) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, user.id, date, time, 'present', 'manual')
      .run();

    const record = await c.env.DB.prepare('SELECT * FROM attendance WHERE id = ?').bind(id).first();
    return c.json({ ...record, _id: record?.id, userId: record?.user_id });
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

router.post('/check-out', protect, allowRoles('staff', 'hod', 'principal'), async (c) => {
  try {
    const user = c.get('user');
    const date = getLocalDateString();
    const time = getLocalTimeString();

    const record = await c.env.DB.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').bind(user.id, date).first();
    if (!record) {
      return c.json({ message: 'No check-in found for today' }, 400);
    }

    const start = parseInt((record.check_in as string).split(':')[0]) * 60 + parseInt((record.check_in as string).split(':')[1]);
    const end = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
    const hours = (end - start) / 60;

    const status = hours >= 8 ? 'full_day' : hours >= 4 ? 'half_day' : 'absent';

    await c.env.DB.prepare('UPDATE attendance SET check_out = ?, total_hours = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(time, Number(hours.toFixed(2)), status, record.id)
      .run();

    const updated = await c.env.DB.prepare('SELECT * FROM attendance WHERE id = ?').bind(record.id).first();
    return c.json({ ...updated, _id: updated?.id, userId: updated?.user_id });
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

router.get('/me', protect, allowRoles('staff', 'hod', 'principal'), async (c) => {
  try {
    const user = c.get('user');
    const month = c.req.query('month');

    let query = 'SELECT * FROM attendance WHERE user_id = ?';
    const params: any[] = [user.id];

    if (month) {
      query += ' AND date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY date ASC';

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(results.map(r => ({ ...r, _id: r.id, userId: r.user_id })));
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

router.get('/user/:userId', protect, allowRoles('principal', 'hod'), async (c) => {
  try {
    const userId = c.req.param('userId');
    const month = c.req.query('month');

    let query = 'SELECT * FROM attendance WHERE user_id = ?';
    const params: any[] = [userId];

    if (month) {
      query += ' AND date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY date ASC';

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(results.map(r => ({ ...r, _id: r.id, userId: r.user_id })));
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

router.get('/:userId', protect, async (c) => {
  try {
    const userId = c.req.param('userId');
    const month = c.req.query('month');

    if (!month) return c.json({ message: 'Month required' }, 400);

    const { results } = await c.env.DB.prepare('SELECT * FROM attendance WHERE user_id = ? AND date LIKE ? ORDER BY date ASC')
      .bind(userId, `${month}%`)
      .all();
      
    return c.json(results.map(r => ({ ...r, _id: r.id, userId: r.user_id })));
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

router.get('/summary/:userId', protect, async (c) => {
  try {
    const userId = c.req.param('userId');
    const month = c.req.query('month');

    if (!month) {
      return c.json({ message: 'Month is required (YYYY-MM)' }, 400);
    }

    const { results } = await c.env.DB.prepare('SELECT status FROM attendance WHERE user_id = ? AND date LIKE ?')
      .bind(userId, `${month}%`)
      .all();

    const summary = {
      totalDays: results.length,
      present: results.filter(r => r.status === 'present').length,
      fullDay: results.filter(r => r.status === 'full_day').length,
      halfDay: results.filter(r => r.status === 'half_day').length,
      leave: results.filter(r => r.status === 'leave').length,
      absent: results.filter(r => r.status === 'absent').length
    };

    return c.json(summary);
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

export default router;
