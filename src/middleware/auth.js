export const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/auth');
  }
};

export const requireLibrarian = (req, res, next) => {
  if (req.session.user && req.session.user.role_name === 'librarian') {
    next();
  } else {
    res.status(403).send('Доступ запрещен');
  }
};

export const requireReader = (req, res, next) => {
  if (req.session.user && req.session.user.role_name === 'reader') {
    next();
  } else {
    res.status(403).send('Доступ запрещен');
  }
};