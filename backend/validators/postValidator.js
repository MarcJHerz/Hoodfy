const { body, validationResult } = require('express-validator');

// Reglas de validación para crear/actualizar posts
exports.postValidationRules = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('El contenido del post es requerido')
    .isLength({ max: 5000 })
    .withMessage('El contenido no puede exceder los 5000 caracteres'),

  body('postType')
    .isIn(['general', 'community'])
    .withMessage('Tipo de post inválido'),

  body('communityId')
    .if(body('postType').equals('community'))
    .notEmpty()
    .withMessage('El ID de la comunidad es requerido para posts de comunidad')
    .isMongoId()
    .withMessage('ID de comunidad inválido'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Los tags deben ser un array')
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error('No se pueden agregar más de 10 tags');
      }
      return true;
    }),

  body('visibility')
    .optional()
    .isIn(['public', 'members', 'private'])
    .withMessage('Visibilidad inválida'),

  body('media')
    .optional()
    .isArray()
    .withMessage('Los archivos multimedia deben ser un array')
    .custom((media) => {
      if (media && media.length > 4) {
        throw new Error('No se pueden agregar más de 4 archivos multimedia');
      }
      return true;
    }),

  body('media.*.type')
    .optional()
    .isIn(['image', 'video'])
    .withMessage('Tipo de archivo multimedia inválido'),

  body('media.*.url')
    .optional()
    .isURL()
    .withMessage('URL de archivo multimedia inválida')
];

// Middleware para validar los resultados
exports.validatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Función auxiliar para validar un post
exports.validatePostData = (postData) => {
  const errors = [];

  // Validar contenido
  if (!postData.content || postData.content.trim().length === 0) {
    errors.push('El contenido del post es requerido');
  } else if (postData.content.length > 5000) {
    errors.push('El contenido no puede exceder los 5000 caracteres');
  }

  // Validar comunidad
  if (postData.postType === 'community' && !postData.communityId) {
    errors.push('El ID de la comunidad es requerido para posts de comunidad');
  }

  // Validar tags
  if (postData.tags && postData.tags.length > 10) {
    errors.push('No se pueden agregar más de 10 tags');
  }

  // Validar visibilidad
  if (postData.visibility && !['public', 'members', 'private'].includes(postData.visibility)) {
    errors.push('Visibilidad inválida');
  }

  // Validar archivos multimedia
  if (postData.media) {
    if (!Array.isArray(postData.media)) {
      errors.push('Los archivos multimedia deben ser un array');
    } else if (postData.media.length > 4) {
      errors.push('No se pueden agregar más de 4 archivos multimedia');
    } else {
      postData.media.forEach((item, index) => {
        if (!['image', 'video'].includes(item.type)) {
          errors.push(`Tipo de archivo multimedia inválido en el índice ${index}`);
        }
        if (!item.url) {
          errors.push(`URL de archivo multimedia inválida en el índice ${index}`);
        }
      });
    }
  }

  return errors.length > 0 ? errors.join(', ') : null;
}; 