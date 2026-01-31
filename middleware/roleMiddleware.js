export const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const userRoles = Array.isArray(req.user.role)
            ? req.user.role
            : [req.user.role];

        const hasRole = userRoles.some(role =>
            allowedRoles.includes(role)
        );

        if (!hasRole) {
            return res.status(403).json({ message: 'Access denied' });
        }

        next();
    };
};
