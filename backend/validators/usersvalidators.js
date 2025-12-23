const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ message: errorMessages, errors: errors.array() });
  }
  next();
};

exports.registerRules = [
  body('name').notEmpty().withMessage('name required'),
  body('email').isEmail().withMessage('valid email required'),
  body('password').isLength({ min: 6 }).withMessage('password min 6 chars'),
  handleValidation,
];

exports.loginRules = [
  body('email').isEmail(),
  body('password').notEmpty(),
  handleValidation,
];

exports.updateUserRules = [
  body('name').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('password').optional().isLength({ min: 6 }),
  handleValidation,
];