const { validationResult } = require('express-validator');

// Middleware that checks validation results and returns 422 if invalid
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

module.exports = validate;