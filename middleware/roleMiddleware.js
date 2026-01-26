export const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role.some(r => roles.includes(r))) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};
