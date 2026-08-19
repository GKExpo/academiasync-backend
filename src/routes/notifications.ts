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

export default router;
