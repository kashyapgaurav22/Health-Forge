const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { permissions } = req.user;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(403).json({ message: 'Forbidden: No permissions assigned' });
    }

    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({ message: `Forbidden: Requires ${requiredPermission} permission` });
    }

    next();
  };
};

module.exports = { checkPermission };
