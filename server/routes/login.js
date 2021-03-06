const router = require('express').Router();
const User = require('../models/user');
const { validateLogin } = require('../validations');
const { toString } = require('../utils');

const viewObj = {
  actionUrl: '/login',
  buttonText: 'Login'
};

const doGet = (req, res) => {
  res.render('signup-login', {
    ...viewObj,
    username: req.username || '',
    errorMessage: req.errorMessage || ''
  });
};

const doPost = (req, res, next) => {
  const { username, password } = req.body;
  const { isValid, errors } = validateLogin(req.body);

  if (!isValid) {
    req.username = username;
    req.errorMessage = toString(errors);
    return next();
  }

  User.findOne({ username }, (err, user) => {
    if (err) return next(err);

    if (!user) {
      req.username = username;
      req.errorMessage = 'Username incorrect';
      return next();
    }

    user.comparePassword(password)
      .then(isMatch => {

        if (!isMatch) {
          req.username = username;
          req.errorMessage = 'Password incorrect.';
          return next();
        }

        req.session._userId = user._id;
        req.session.username = user.username;
        req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;

        res.redirect('/');
      })
      .catch(err => next(err));
  });
};

router.get('/', doGet);
router.post('/', doPost, doGet);

module.exports = router;
