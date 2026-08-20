import { Hono } from 'hono';
import { Bindings } from '../index';
import { protect } from '../middleware/auth';

const router = new Hono<{ Bindings: Bindings, Variables: { user: any } }>();

router.get('/', protect, async (c) => {
  try {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC')
      .bind(user.id)
      .all();
    
    return c.json(results.map(r => ({ ...r, _id: r.id, isRead: r.is_read })));
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

router.put('/read-all', protect, async (c) => {
  try {
    const user = c.get('user');
    await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
      .bind(user.id)
      .run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

router.put('/:id/read', protect, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ message: err.message }, 500);
  }
});

export default router;
