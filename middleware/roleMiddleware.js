export const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const userRoles = req.user.role || [];

        const hasAccess = userRoles.some(role =>
            allowedRoles.includes(role)
        );

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        next();
    };
};
