import { Hono } from 'hono';
import { Bindings } from '../index';
import { protect, allowRoles } from '../middleware/auth';

const router = new Hono<{ Bindings: Bindings, Variables: { user: any } }>();

router.get('/', protect, allowRoles('admin'), async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT id, name, email, roles, department, employee_id, reports_to, is_active FROM users WHERE is_active = 1').all();
    const mapped = results.map(u => ({ ...u, _id: u.id, role: JSON.parse(u.roles as string) }));
    return c.json(mapped);
  } catch (err) {
    return c.json({ message: 'Server error' }, 500);
  }
});

router.get('/me', protect, async (c) => {
  const user = c.get('user');
  return c.json({ ...user, _id: user.id, role: user.roles });
});

router.get('/:id', protect, async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    if (!user.roles.includes('admin') && user.id !== id) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const { results } = await c.env.DB.prepare('SELECT id, name, email, roles, department, employee_id, reports_to, is_active FROM users WHERE id = ?')
      .bind(id)
      .all();

    if (results.length === 0) {
      return c.json({ message: 'User not found' }, 404);
    }

    const targetUser = results[0];
    return c.json({ ...targetUser, _id: targetUser.id, role: JSON.parse(targetUser.roles as string) });
  } catch (err) {
    return c.json({ message: 'Server error' }, 500);
  }
});

router.get('/:id/subordinates', protect, allowRoles('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const { results } = await c.env.DB.prepare('SELECT id, name, email, roles, department, employee_id, reports_to, is_active FROM users WHERE reports_to = ? AND is_active = 1')
      .bind(id)
      .all();
    
    const mapped = results.map(u => ({ ...u, _id: u.id, role: JSON.parse(u.roles as string) }));
    return c.json(mapped);
  } catch (err) {
    return c.json({ message: 'Server error' }, 500);
  }
});

export default router;
