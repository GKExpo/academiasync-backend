import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

export const protect = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Not authorized, no token' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256');
    
    // Fetch user from DB
    const { results } = await c.env.DB.prepare('SELECT id, name, email, roles, department, employee_id, reports_to, is_active FROM users WHERE id = ?')
      .bind(decoded.id)
      .all();

    if (results.length === 0) {
      return c.json({ message: 'User not found' }, 401);
    }
    
    const user = results[0];
    user.roles = JSON.parse(user.roles as string);
    c.set('user', user);

    await next();
  } catch (error) {
    return c.json({ message: 'Not authorized, token failed' }, 401);
  }
};

export const allowRoles = (...roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user || !user.roles) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const hasRole = user.roles.some((role: string) => roles.includes(role));
    if (!hasRole) {
      return c.json({ message: 'Access denied' }, 403);
    }

    await next();
  };
};
