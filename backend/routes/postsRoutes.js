const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Post = require('../models/Post');
const Community = require('../models/Community');
const { verifyToken } = require('../middleware/authMiddleware');
const Ally = require('../models/Ally');
const postController = require('../controllers/postController');
const { postValidationRules, validatePost } = require('../validators/postValidator');
const { apiRateLimit } = require('../middleware/rateLimiter');
const Comment = require('../models/Comment');
const { generateVideoThumbnail } = require('../utils/generateThumbnail');

// 📦 Crear carpeta si no existe
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// 📷 Configuración de multer para imágenes y videos - MIGRADO A S3
const storage = multer.memoryStorage();

// Función para detectar el tipo MIME real de un archivo
function detectMimeType(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Mapeo de extensiones a tipos MIME
  const mimeMap = {
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.m4v': 'video/mp4',
    '.3gp': 'video/3gpp'
  };
  
  return mimeMap[ext] || file.mimetype;
  }

// Configurar multer con límites más generosos y detección mejorada de MIME
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB límite para videos grandes
    files: 10, // Máximo 10 archivos por request
    fieldSize: 50 * 1024 * 1024, // 50MB por campo
    fieldNameSize: 100 // Tamaño máximo del nombre del campo
  },
  fileFilter: (req, file, cb) => {
      // Detectar el tipo MIME real basado en la extensión
      const realMimeType = detectMimeType(file);
      
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
        'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence',
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi'
      ];
      
      if (allowedTypes.includes(realMimeType)) {
      cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no soportado: ${realMimeType}. Solo se permiten imágenes (JPEG, PNG, GIF, WebP, HEIC, HEIF) y videos (MP4, MOV, WebM, AVI)`));
    }
  }
});

// 📌 Endpoint público para obtener posts de un usuario (sin autenticación) - DEBE IR ANTES DEL MIDDLEWARE
router.get('/public/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 6 } = req.query;
    
    // Buscar usuario por ID o Firebase UID
    const User = require('../models/User');
    let user = await User.findById(userId).catch(() => null);
    if (!user) {
      user = await User.findOne({ firebaseUid: userId });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener posts públicos del usuario (solo posts generales, no de comunidades privadas)
    const posts = await Post.find({
      author: user._id,
      type: 'general', // Solo posts generales
      isPublic: true // Solo posts públicos
    })
    .populate('author', 'name username profilePicture')
    .populate('community', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    // Contar total de posts públicos
    const totalPosts = await Post.countDocuments({
      author: user._id,
      type: 'general',
      isPublic: true
    });

    res.json({
      posts,
      totalPosts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / parseInt(limit))
    });
  } catch (error) {
    console.error('Error al obtener posts públicos del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Middleware de autenticación para todas las rutas protegidas
router.use(verifyToken);

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The file exceeds the allowed size limit (500MB)'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      error: 'Too many files',
      message: 'You cannot upload more than 10 files at once'
    });
  }
  
  if (error.message.includes('Tipo de archivo no soportado')) {
    return res.status(400).json({
      error: 'Unsupported file type',
      message: error.message
    });
  }
  
  return res.status(500).json({
    error: 'Error processing files',
    message: error.message
  });
};

// Middleware para validar archivos de posts
const validatePostFile = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const { originalname, mimetype, size } = req.file;
  
  // Detectar MIME type real
  const realMimeType = detectMimeType(req.file);
  
  // Verificar tipo de archivo permitido
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/x-msvideo'
  ];

  if (allowedTypes.includes(realMimeType)) {
    return next();
  } else {
    return res.status(400).json({ 
      error: `File type not allowed: ${realMimeType}` 
    });
  }
};

// Crear un nuevo post SOLO usando el controlador moderno (S3)
router.post('/', apiRateLimit, upload.any(), handleMulterError, (req, res, next) => {
  // Llamar al controlador
  postController.createPost(req, res, next);
});

// Obtener posts de una comunidad
router.get('/community/:communityId', apiRateLimit, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { sort } = req.query;

    const query = { community: communityId };
    const sortOptions = {
      recent: { createdAt: -1 },
      popular: { likes: -1 },
      featured: { isFeatured: -1, createdAt: -1 }
    };

    const posts = await Post.find(query)
      .sort(sortOptions[sort] || sortOptions.recent)
      .populate('author', 'name username profilePicture')
      .populate('comments.author', 'name username profilePicture');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error getting posts' });
  }
});

// Dar like a un post
router.post('/:postId/like', apiRateLimit, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.userId; // ✅ FIXED: Cambiar req.user._id por req.userId
    if (post.likes.includes(userId)) {
      return res.status(400).json({ error: 'You have already liked this post' });
    }

    post.likes.push(userId);
    await post.save();

    res.json({ 
      message: 'Like added successfully',
      likesCount: post.likes.length 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error liking the post' });
  }
});

// Quitar like a un post
router.post('/:postId/unlike', apiRateLimit, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.userId; // ✅ FIXED: Cambiar req.user._id por req.userId
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ error: 'You have not liked this post' });
    }

    post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    await post.save();

    res.json({ 
      message: 'Like removed successfully',
      likesCount: post.likes.length 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error unliking the post' });
  }
});

// Comentar en un post
router.post('/:postId/comment', apiRateLimit, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = {
      content,
      author: req.userId, // ✅ FIXED: Cambiar req.user._id por req.userId
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Poblar los datos del autor del comentario
    await post.populate('comments.author', 'name username profilePicture');

    res.json({
      message: 'Comment added successfully',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: 'Error adding the comment' });
  }
});

// Eliminar un post
router.delete('/:postId', apiRateLimit, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Verificar si el usuario es el autor o el creador de la comunidad
    const community = await Community.findById(post.community);
    const isAuthor = post.author.toString() === req.userId.toString(); // ✅ FIXED: req.user._id -> req.userId
    const isCreator = community.creator.toString() === req.userId.toString(); // ✅ FIXED: req.user._id -> req.userId

    if (!isAuthor && !isCreator) {
      return res.status(403).json({ error: 'You do not have permission to delete this post' });
    }

    await post.deleteOne();

    // Actualizar estadísticas de la comunidad
    await Community.findByIdAndUpdate(post.community, {
      $inc: { postCount: -1 }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting the post' });
  }
});

// Actualizar un post
router.put('/:postId', 
  apiRateLimit,
  postController.updatePost
);

// 📌 Obtener un post específico por ID
router.get('/:postId', 
  apiRateLimit,
  postController.getPostById
);

// ✅ Obtener publicaciones por usuario
router.get('/user/:userId', 
  apiRateLimit,
  postController.getUserPosts
);

// 📌 Eliminar un comentario
router.delete('/:postId/comment/:commentId', 
  apiRateLimit,
  postController.deleteComment
);

// 📌 Obtener posts para el HomeScreen (posts generales y de comunidad)
router.get('/home/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1. Obtener los aliados del usuario
    const allies = await Ally.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    });
    const allyIds = allies.map(a =>
      a.user1.toString() === userId ? a.user2 : a.user1
    );
    allyIds.push(userId); // Incluir el propio usuario

    // 2. Obtener todas las comunidades del usuario
    const userCommunities = await Community.find({ members: userId });
    const communityIds = userCommunities.map(c => c._id);

    // 3. Obtener posts de aliados y de comunidades
    const posts = await Post.find({
      $or: [
        // Posts generales de aliados y del propio usuario
        {
          author: { $in: allyIds },
          postType: 'general'
        },
        // Posts de comunidades a las que pertenece el usuario
        {
          community: { $in: communityIds },
          postType: 'community'
        }
      ]
    })
    .populate('author', 'name username profilePicture')
    .populate('community', 'name coverImage')
    .sort({ createdAt: -1 });

    // 4. Procesar los posts para incluir URLs completas
    const processedPosts = posts.map(post => {
      const processedPost = post.toObject();
      const baseUrl = process.env.BASE_URL || 'https://api.qahood.com';
      
      // Procesar imagen de perfil del usuario
      if (processedPost.author && processedPost.author.profilePicture) {
        // Mantener la key de S3 tal como está, no convertir a URL local
        // El frontend se encargará de obtener la URL firmada
        processedPost.author.profilePicture = processedPost.author.profilePicture;
      }
      
      // Procesar imágenes del post
      if (processedPost.media && processedPost.media.length > 0) {
        processedPost.media = processedPost.media.map(media => ({
          ...media,
          // Si es una key de S3 (no contiene http), mantenerla como key
          // El frontend se encargará de obtener la URL firmada
          url: media.url.startsWith('http') ? media.url : media.url,
          thumbnail: media.thumbnail 
            ? (media.thumbnail.startsWith('http') ? media.thumbnail : media.thumbnail)
            : null
        }));
      }
      
      // Procesar imagen de portada de la comunidad si existe
      if (processedPost.community && processedPost.community.coverImage) {
        // Mantener la key de S3 tal como está, no convertir a URL local
        // El frontend se encargará de obtener la URL firmada
        processedPost.community.coverImage = processedPost.community.coverImage;
      }
      
      return processedPost;
    });

    res.json(processedPosts);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener los posts',
      details: error.message 
    });
  }
});

// Agregar comentario a un post
router.post('/:postId/comments', apiRateLimit, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;
    const { postId } = req.params;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Si es una respuesta a otro comentario
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }

      const reply = new Comment({
        content,
        user: userId,
        post: postId,
        parentComment: parentCommentId
      });

      await reply.save();

      // Agregar la respuesta al comentario padre
      parentComment.replies.push(reply._id);
      await parentComment.save();

      // Poblar los datos del usuario
      await reply.populate('user', 'name username profilePicture');

      res.status(201).json({
        message: 'Reply added successfully',
        comment: reply
      });
    } else {
      // Es un comentario nuevo
      const comment = new Comment({
        content,
        user: userId,
        post: postId
      });

      await comment.save();

      // Actualizar el contador de comentarios del post
      post.commentsCount = (post.commentsCount || 0) + 1;
      await post.save();

      // Poblar los datos del usuario
      await comment.populate('user', 'name username profilePicture');

      res.status(201).json({
        message: 'Comment added successfully',
        comment
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error adding the comment' });
  }
});

// Obtener comentarios de un post
router.get('/:postId/comments', apiRateLimit, async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ 
      post: postId,
      parentComment: null // Solo comentarios principales
    })
    .populate('user', 'name username profilePicture')
    .populate({
      path: 'replies',
      populate: [
        {
          path: 'user',
          select: 'name username profilePicture'
        },
        {
          path: 'replies',
          populate: {
            path: 'user',
            select: 'name username profilePicture'
          }
        }
      ]
    })
    .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Error getting comments' });
  }
});

router.post('/create', upload.array('media', 10), async (req, res) => {
  try {
    const { content, userId, communityId, postType } = req.body;
    
    // Procesar archivos subidos - MIGRAR A S3
    const mediaFiles = [];
    if (req.files && req.files.length > 0) {
      try {
        const { uploadFileToS3 } = require('../utils/s3');
        
      for (const file of req.files) {
        const isVideo = file.mimetype.startsWith('video/');
          
          // Subir a S3
          const { buffer, originalname, mimetype } = file;
          const s3Key = await uploadFileToS3(buffer, originalname, mimetype);
        
        mediaFiles.push({
          type: isVideo ? 'video' : 'image',
            url: s3Key, // Guardar la key de S3
          // Para videos, usamos el mismo archivo como miniatura
            // El frontend se encargará de obtener la URL firmada
            thumbnail: isVideo ? s3Key : null
        });
        }
      } catch (error) {
        return res.status(500).json({ error: 'Error uploading files' });
      }
    }

    // Crear el post
    const post = new Post({
      content,
      author: userId,
      community: communityId,
      postType: postType || 'general',
      media: mediaFiles
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error creating the post',
      details: error.message 
    });
  }
});

// Destacar o quitar destaque de un post
router.post('/:postId/pin', apiRateLimit, postController.togglePinPost);

// Obtener posts filtrados por tipo (creador o comunidad)
router.get('/community/:communityId/filtered', apiRateLimit, postController.getCommunityPostsFiltered);


module.exports = router; 