const Post = require('../models/Post');
const Community = require('../models/Community');
const User = require('../models/User');
// const { uploadToFirebase } = require('../utils/firebaseStorage'); // Eliminado para usar solo almacenamiento local
const { validatePostData } = require('../validators/postValidator');

// Función auxiliar para asegurar URLs absolutas
const ensureAbsoluteUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = process.env.BASE_URL || 'https://api.qahood.com';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Crear un nuevo post
exports.createPost = async (req, res) => {
  try {
    const { content, communityId, tags, visibility } = req.body;
    let { media } = req.body;
    
    // Asegurar que media siempre sea un array
    if (typeof media === 'string') {
      try {
        media = JSON.parse(media);
      } catch (e) {
        console.error('Error al parsear media:', e, 'media:', media);
        media = [];
      }
    }
    
    // Si media es undefined, null, o un objeto vacío, establecerlo como array vacío
    if (!media || !Array.isArray(media)) {
      media = [];
    }
    
    console.log('📊 Media procesada:', { originalMedia: req.body.media, processedMedia: media, isArray: Array.isArray(media) });
    
    const userId = (req.user && req.user._id) ? req.user._id : req.userId;

    // Logging para debugging
    console.log('🔍 Datos antes de validación:', {
      content: content ? 'presente' : 'ausente',
      postType: req.body.postType,
      communityId: communityId || 'no especificado',
      media: media,
      mediaType: typeof media,
      isArray: Array.isArray(media),
      mediaLength: media ? media.length : 0
    });

    // Validar el post de forma síncrona
    const validationError = validatePostData({
      content,
      postType: req.body.postType,
      communityId,
      tags,
      visibility,
      media
    });
    
    if (validationError) {
      console.log('❌ Error de validación:', validationError);
      return res.status(400).json({ error: validationError });
    }

    // Verificar que la comunidad existe y el usuario es miembro (solo para posts de comunidad)
    let community = null;
    if (req.body.postType === 'community') {
      if (!communityId) {
        return res.status(400).json({ error: 'El ID de la comunidad es requerido para posts de comunidad' });
      }
      
      community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    const isMember = community.members.includes(userId);
    if (!isMember && !community.creator.equals(userId)) {
      return res.status(403).json({ error: 'No eres miembro de esta comunidad' });
      }
    }

    // Procesar archivos multimedia si existen
    let processedMedia = [];
    if (req.files && req.files.length > 0) {
      console.log(`📁 Procesando ${req.files.length} archivos para subir a S3`);
      
      processedMedia = await Promise.all(
        req.files.map(async (file) => {
          try {
            const { uploadFileToS3 } = require('../utils/s3');
            const { buffer, originalname, mimetype } = file;
            
            console.log(`⬆️ Subiendo archivo: ${originalname}`);
            const s3Key = await uploadFileToS3(buffer, originalname, mimetype);
            console.log(`✅ Archivo subido con key: ${s3Key}`);
            
            // Si es un video, generar miniatura
            let thumbnailKey = null;
            if (mimetype.startsWith('video/')) {
              try {
                console.log(`🎬 Generando miniatura para video: ${originalname}`);
                
                // Guardar temporalmente el video para generar miniatura
                const tempVideoPath = `/tmp/${originalname}`;
                require('fs').writeFileSync(tempVideoPath, buffer);
                
                // Generar miniatura
                const { generateThumbnail } = require('../utils/generateThumbnail');
                const thumbnailFilename = `${path.parse(originalname).name}_thumb.jpg`;
                const tempThumbnailPath = `/tmp/${thumbnailFilename}`;
                
                await generateThumbnail(tempVideoPath, tempThumbnailPath, 1);
                
                // Leer la miniatura generada y subirla a S3
                const thumbnailBuffer = require('fs').readFileSync(tempThumbnailPath);
                thumbnailKey = await uploadFileToS3(thumbnailBuffer, thumbnailFilename, 'image/jpeg');
                
                console.log(`✅ Miniatura generada y subida: ${thumbnailKey}`);
                
                // Limpiar archivos temporales
                require('fs').unlinkSync(tempVideoPath);
                require('fs').unlinkSync(tempThumbnailPath);
              } catch (thumbnailError) {
                console.error(`❌ Error generando miniatura para ${originalname}:`, thumbnailError);
                // Continuar sin miniatura si falla
              }
            }
            
            return {
              url: s3Key, // Guardar solo la key de S3
              type: mimetype.startsWith('image/') ? 'image' : 'video',
              thumbnail: thumbnailKey, // Key de la miniatura si existe
              metadata: {
                originalName: originalname,
                size: file.size
              }
            };
          } catch (error) {
            console.error(`❌ Error subiendo archivo ${file.originalname}:`, error);
            throw new Error(`Error al subir archivo: ${file.originalname}`);
          }
        })
      );
    }

    // Crear el post
    const postData = {
      content,
      author: userId,
      media: processedMedia,
      tags: tags || [],
      visibility: visibility || 'members',
      postType: req.body.postType
    };
    if (req.body.postType === 'community') {
      postData.community = communityId;
    }
    const post = new Post(postData);
    await post.save();

    // Actualizar estadísticas de la comunidad solo si es post de comunidad
    if (req.body.postType === 'community' && community) {
      await Community.findByIdAndUpdate(communityId, {
        $inc: { postCount: 1 }
      });
    }

    // Poblar los datos del autor
    await post.populate('author', 'name username profilePicture');

    res.status(201).json({
      message: 'Post creado exitosamente',
      post
    });
  } catch (error) {
    console.error('Error al crear post (detalle):', error);
    res.status(500).json({
      error: 'Error al crear el post',
      details: error.message,
      stack: error.stack
    });
  }
};

// Obtener posts de una comunidad
exports.getCommunityPosts = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const userId = req.user._id;

    // Verificar que la comunidad existe
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    // Construir el query base
    let query = {
      community: communityId,
      status: 'active'
    };

    // Ajustar visibilidad según el rol del usuario
    if (!community.members.includes(userId) && !community.creator.equals(userId)) {
      query.visibility = 'public';
    }

    // Construir el sort
    let sortOption = {};
    switch (sort) {
      case 'popular':
        sortOption = { 'engagement.views': -1 };
        break;
      case 'mostLiked':
        sortOption = { likes: -1 };
        break;
      case 'mostCommented':
        sortOption = { 'comments.length': -1 };
        break;
      default: // 'recent'
        // Ordenar por destacados primero, luego por fecha de creación
        sortOption = { isPinned: -1, createdAt: -1 };
    }

    // Ejecutar la consulta
    const posts = await Post.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'name username profilePicture')
      .populate('comments.author', 'name username profilePicture');

    // Procesar URLs de medios - mantener keys de S3 como están sin procesamiento adicional
    posts.forEach(post => {
      if (post.media && post.media.length > 0) {
        post.media = post.media.map(item => ({
          ...item.toObject(),
          // Mantener la URL tal como está almacenada (key de S3)
          url: item.url,
          thumbnail: item.thumbnail || null
        }));
      }
    });

    // Obtener el total de posts para la paginación
    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener posts:', error);
    res.status(500).json({
      error: 'Error al obtener los posts',
      details: error.message
    });
  }
};

// Dar like a un post
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar que el usuario tiene permiso para ver el post
    const community = await Community.findById(post.community);
    if (!community.members.includes(userId) && !community.creator.equals(userId)) {
      return res.status(403).json({ error: 'No tienes permiso para interactuar con este post' });
    }

    await post.addLike(userId);

    res.json({
      message: 'Like agregado exitosamente',
      likes: post.likes.length
    });
  } catch (error) {
    console.error('Error al dar like:', error);
    res.status(500).json({
      error: 'Error al dar like',
      details: error.message
    });
  }
};

// Comentar en un post
exports.commentPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'El contenido del comentario es requerido' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar que el usuario tiene permiso para comentar
    const community = await Community.findById(post.community);
    if (!community.members.includes(userId) && !community.creator.equals(userId)) {
      return res.status(403).json({ error: 'No tienes permiso para comentar en este post' });
    }

    const comment = {
      content,
      author: userId
    };

    await post.addComment(comment);
    await post.populate('comments.author', 'name username profilePicture');

    res.json({
      message: 'Comentario agregado exitosamente',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error('Error al comentar:', error);
    res.status(500).json({
      error: 'Error al agregar el comentario',
      details: error.message
    });
  }
};

// Obtener un post específico por ID
exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId)
      .populate('author', 'name username profilePicture')
      .populate('community', 'name coverImage')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name username profilePicture'
        }
      });

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar permisos de visibilidad
    const community = await Community.findById(post.community);
    if (!community.members.includes(userId) && !community.creator.equals(userId)) {
      if (post.visibility !== 'public') {
        return res.status(403).json({ error: 'No tienes permiso para ver este post' });
      }
    }

    // Procesar URLs de medios - mantener keys de S3 como están sin procesamiento adicional
    if (post.media && post.media.length > 0) {
      post.media = post.media.map(item => ({
        ...item.toObject(),
        // Mantener la URL tal como está almacenada (key de S3)
        url: item.url,
        thumbnail: item.thumbnail || null
      }));
    }

    res.json(post);
  } catch (error) {
    console.error('Error al obtener post:', error);
    res.status(500).json({
      error: 'Error al obtener el post',
      details: error.message
    });
  }
};

// Obtener posts de un usuario específico
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener los posts del usuario
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'name username profilePicture')
      .populate('community', 'name image')
      .populate('comments.author', 'name username profilePicture');

    // Procesar URLs de medios - mantener keys de S3 como están
    posts.forEach(post => {
      if (post.media && post.media.length > 0) {
        post.media = post.media.map(item => ({
          ...item.toObject(),
          // Si es una key de S3 (no contiene http), mantenerla como key
          // Si es una URL completa, mantenerla tal como está
          url: item.url.startsWith('http') ? item.url : item.url,
          thumbnail: item.thumbnail 
            ? (item.thumbnail.startsWith('http') ? item.thumbnail : item.thumbnail)
            : null
        }));
      }
    });

    // Obtener el total de posts para la paginación
    const total = await Post.countDocuments({ author: userId });

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener posts del usuario:', error);
    res.status(500).json({
      error: 'Error al obtener los posts del usuario',
      details: error.message
    });
  }
};

// Quitar like de un post
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar que el usuario tiene permiso para interactuar con el post
    const community = await Community.findById(post.community);
    if (!community.members.includes(userId) && !community.creator.equals(userId)) {
      return res.status(403).json({ error: 'No tienes permiso para interactuar con este post' });
    }

    await post.removeLike(userId);

    res.json({
      message: 'Like eliminado exitosamente',
      likes: post.likes.length
    });
  } catch (error) {
    console.error('Error al quitar like:', error);
    res.status(500).json({
      error: 'Error al quitar like',
      details: error.message
    });
  }
};

// Eliminar un comentario
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Verificar que el usuario es el autor del comentario o el autor del post
    if (!comment.author.equals(userId) && !post.author.equals(userId)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
    }

    comment.remove();
    await post.save();

    res.json({
      message: 'Comentario eliminado exitosamente',
      comments: post.comments.length
    });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({
      error: 'Error al eliminar el comentario',
      details: error.message
    });
  }
};

// Actualizar un post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, tags, visibility } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar que el usuario es el autor del post
    if (!post.author.equals(userId)) {
      return res.status(403).json({ error: 'No tienes permiso para editar este post' });
    }

    // Actualizar campos
    if (content) post.content = content;
    if (tags) post.tags = tags;
    if (visibility) post.visibility = visibility;

    await post.save();

    res.json({
      message: 'Post actualizado exitosamente',
      post
    });
  } catch (error) {
    console.error('Error al actualizar post:', error);
    res.status(500).json({
      error: 'Error al actualizar el post',
      details: error.message
    });
  }
};

// Eliminar un post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar que el usuario es el autor del post
    if (!post.author.equals(userId)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este post' });
    }

    await post.remove();

    // Actualizar estadísticas de la comunidad
    await Community.findByIdAndUpdate(post.community, {
      $inc: { postCount: -1 }
    });

    res.json({
      message: 'Post eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar post:', error);
    res.status(500).json({
      error: 'Error al eliminar el post',
      details: error.message
    });
  }
}; 

// Destacar o quitar destaque de un post (solo creador de la comunidad)
exports.togglePinPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId).populate('community');
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    // Verificar que el usuario es el creador de la comunidad
    const community = await Community.findById(post.community._id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    if (!community.creator) {
      return res.status(400).json({ error: 'La comunidad no tiene un creador definido' });
    }

    if (community.creator.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Solo el creador de la comunidad puede destacar posts' });
    }

    // Si se va a destacar este post, quitar destaque de otros posts de la misma comunidad
    if (!post.isPinned) {
      await Post.updateMany(
        { community: post.community._id, isPinned: true },
        { isPinned: false, pinnedAt: null }
      );
    }

    await post.togglePin();

    res.json({
      message: post.isPinned ? 'Post destacado exitosamente' : 'Post quitado de destacados',
      post: {
        _id: post._id,
        isPinned: post.isPinned,
        pinnedAt: post.pinnedAt
      }
    });
  } catch (error) {
    console.error('Error al destacar/quitar destaque del post:', error);
    res.status(500).json({
      error: 'Error al cambiar el estado de destaque del post',
      details: error.message
    });
  }
};

// Obtener posts filtrados por tipo (creador o comunidad)
exports.getCommunityPostsFiltered = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { page = 1, limit = 10, filter = 'creator' } = req.query; // 'creator' | 'community'
    const userId = req.userId;

    // Verificar que la comunidad existe
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    // Verificar que la comunidad tiene un creador
    if (!community.creator) {
      return res.status(400).json({ error: 'La comunidad no tiene un creador definido' });
    }

    // Construir el query base
    let query = {
      community: communityId
    };

    // Filtrar por tipo de post
    if (filter === 'creator') {
      query.author = community.creator;
    } else if (filter === 'community') {
      // Posts de cualquier miembro que no sea el creador
      query.author = { $ne: community.creator };
    }

    // Ajustar visibilidad según el rol del usuario (solo si la comunidad es privada)
    const isMember = community.members && community.members.includes(userId);
    const isCreator = community.creator.toString() === userId.toString();
    
    if (!isMember && !isCreator && community.isPrivate) {
      // Si no es miembro ni creador y la comunidad es privada, no mostrar posts
      return res.json({
        posts: [],
        filter,
        pagination: {
          total: 0,
          page: parseInt(page),
          pages: 0
        }
      });
    }

    // Construir el sort - posts destacados primero para filtro de creador
    let sortOption = {};
    if (filter === 'creator') {
      sortOption = { isPinned: -1, createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    // Ejecutar la consulta
    const posts = await Post.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'name username profilePicture')
      .populate('comments.author', 'name username profilePicture');

    // Asegurar URLs absolutas en los medios
    posts.forEach(post => {
      if (post.media && post.media.length > 0) {
        post.media = post.media.map(item => ({
          ...item.toObject(),
          url: ensureAbsoluteUrl(item.url),
          thumbnail: item.thumbnail ? ensureAbsoluteUrl(item.thumbnail) : null
        }));
      }
    });

    // Obtener el total de posts para la paginación
    const total = await Post.countDocuments(query);

    res.json({
      posts,
      filter,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener posts filtrados:', error);
    res.status(500).json({
      error: 'Error al obtener los posts filtrados',
      details: error.message
    });
  }
}; 