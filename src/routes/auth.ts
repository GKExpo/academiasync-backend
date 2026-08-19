import { Hono } from 'hono';
import { Bindings } from '../index';
import { sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const router = new Hono<{ Bindings: Bindings }>();

router.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ message: 'Email and password required' }, 400);
    }

    const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
      .bind(email)
      .all();

    if (results.length === 0) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password_hash as string);
    
    if (!isMatch) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    const roles = JSON.parse(user.roles as string);
    const payload = {
      id: user.id,
      role: roles,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 1 day
    };

    const token = await sign(payload, c.env.JWT_SECRET, 'HS256');

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roles
      },
      token
    });

  } catch (err) {
    console.error(err);
    return c.json({ message: 'Server error' }, 500);
  }
});

export default router;
