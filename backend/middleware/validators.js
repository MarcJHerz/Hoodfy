const { body, validationResult } = require('express-validator');

const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres'),
  
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('El nombre de usuario debe tener al menos 3 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido'),
  
  body('firebaseUid')
    .notEmpty()
    .withMessage('El ID de Firebase es obligatorio')
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido'),
  
  body('firebaseUid')
    .notEmpty()
    .withMessage('El ID de Firebase es obligatorio')
];

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Error de validación',
      details: errors.array().reduce((acc, error) => {
        acc[error.path] = error.msg;
        return acc;
      }, {})
    });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateResult
}; 