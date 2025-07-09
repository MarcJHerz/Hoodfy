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
const rateLimiter = require('../middleware/rateLimiter');
const Comment = require('../models/Comment');
const { generateVideoThumbnail } = require('../utils/generateThumbnail');

// 📦 Crear carpeta si no existe
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Configurar almacenamiento para imágenes y videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/posts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrar archivos por tipo
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes (JPEG, PNG, GIF) y videos (MP4, MOV)'));
  }
};

// Configurar multer
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes (JPEG, PNG, GIF) y videos (MP4, MOV)'));
    }
  }
});

// Middleware de autenticación para todas las rutas
router.use(verifyToken);

// Crear un nuevo post SOLO usando el controlador moderno (S3)
router.post('/', rateLimiter, upload.any(), postController.createPost);

// Obtener posts de una comunidad
router.get('/community/:communityId', rateLimiter, async (req, res) => {
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
    console.error('Error al obtener posts:', error);
    res.status(500).json({ error: 'Error al obtener los posts' });
  }
});

// Dar like a un post
router.post('/:postId/like', rateLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const userId = req.user._id;
    if (post.likes.includes(userId)) {
      return res.status(400).json({ error: 'Ya has dado like a este post' });
    }

    post.likes.push(userId);
    await post.save();

    res.json({ message: 'Like agregado exitosamente' });
  } catch (error) {
    console.error('Error al dar like:', error);
    res.status(500).json({ error: 'Error al dar like al post' });
  }
});

// Quitar like a un post
router.post('/:postId/unlike', rateLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const userId = req.user._id;
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ error: 'No has dado like a este post' });
    }

    post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    await post.save();

    res.json({ message: 'Like removido exitosamente' });
  } catch (error) {
    console.error('Error al quitar like:', error);
    res.status(500).json({ error: 'Error al quitar like al post' });
  }
});

// Comentar en un post
router.post('/:postId/comment', rateLimiter, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'El contenido del comentario es requerido' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const comment = {
      content,
      author: req.user._id,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Poblar los datos del autor del comentario
    await post.populate('comments.author', 'name username profilePicture');

    res.json({
      message: 'Comentario agregado exitosamente',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error('Error al comentar:', error);
    res.status(500).json({ error: 'Error al agregar el comentario' });
  }
});

// Eliminar un post
router.delete('/:postId', rateLimiter, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar si el usuario es el autor o el creador de la comunidad
    const community = await Community.findById(post.community);
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isCreator = community.creator.toString() === req.user._id.toString();

    if (!isAuthor && !isCreator) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este post' });
    }

    await post.deleteOne();

    // Actualizar estadísticas de la comunidad
    await Community.findByIdAndUpdate(post.community, {
      $inc: { postCount: -1 }
    });

    res.json({ message: 'Post eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar post:', error);
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
});

// Actualizar un post
router.put('/:postId', 
  rateLimiter,
  postController.updatePost
);

// 📌 Obtener un post específico por ID
router.get('/:postId', 
  rateLimiter,
  postController.getPostById
);

// ✅ Obtener publicaciones por usuario
router.get('/user/:userId', 
  rateLimiter,
  postController.getUserPosts
);

// 📌 Eliminar un comentario
router.delete('/:postId/comment/:commentId', 
  rateLimiter,
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
    console.error('❌ Error al obtener posts para HomeScreen:', error);
    res.status(500).json({ 
      error: 'Error al obtener los posts',
      details: error.message 
    });
  }
});

// Agregar comentario a un post
router.post('/:postId/comments', rateLimiter, async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;
    const { postId } = req.params;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json({ error: 'El contenido del comentario es requerido' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Si es una respuesta a otro comentario
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ error: 'Comentario padre no encontrado' });
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
        message: 'Respuesta agregada exitosamente',
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
        message: 'Comentario agregado exitosamente',
        comment
      });
    }
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ error: 'Error al agregar el comentario' });
  }
});

// Obtener comentarios de un post
router.get('/:postId/comments', rateLimiter, async (req, res) => {
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
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener los comentarios' });
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
        console.error('Error al subir archivos a S3:', error);
        return res.status(500).json({ error: 'Error al subir los archivos' });
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
    console.error('Error al crear post:', error);
    res.status(500).json({ 
      error: 'Error al crear el post',
      details: error.message 
    });
  }
});

// Destacar o quitar destaque de un post
router.post('/:postId/pin', rateLimiter, postController.togglePinPost);

// Obtener posts filtrados por tipo (creador o comunidad)
router.get('/community/:communityId/filtered', rateLimiter, postController.getCommunityPostsFiltered);

module.exports = router; 