const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

exports.createProductRules = [
  body('title').notEmpty().withMessage('title is required'),
  body('price').isFloat({ min: 0 }).withMessage('price must be >= 0'),
  body('stock').optional().isInt({ min: 0 }).withMessage('stock must be >= 0'),
  body('category').optional().isString(),
  handleValidation,
];

exports.updateProductRules = [
  body('title').optional().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  handleValidation,
];