const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { verifyToken } = require('../middleware/authMiddleware');

// ✅ Agregar un comentario
router.post('/:postId', verifyToken, async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    const postId = req.params.postId;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        details: { content: 'El contenido del comentario es obligatorio' }
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        error: 'Publicación no encontrada',
        details: { postId: 'La publicación no existe' }
      });
    }

    // Si es una respuesta, verificar que el comentario padre existe
    if (parentComment) {
      const parentCommentExists = await Comment.findById(parentComment);
      if (!parentCommentExists) {
        return res.status(404).json({
          error: 'Comentario padre no encontrado',
          details: { parentComment: 'El comentario al que intentas responder no existe' }
        });
      }
    }

    const newComment = new Comment({
      content,
      user: userId,
      post: postId,
      parentComment: parentComment || null
    });

    // Guardar el comentario
    await newComment.save();

    // Si es una respuesta, actualizar el comentario padre
    if (parentComment) {
      await Comment.findByIdAndUpdate(
        parentComment,
        { $push: { replies: newComment._id } }
      );
    }

    // Actualizar el post con el nuevo comentario
    await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: newComment._id } }
    );

    // Populate el autor del comentario antes de enviar la respuesta
    const populatedComment = await Comment.findById(newComment._id)
      .populate('user', 'name username profilePicture')
      .lean();

    res.status(201).json({ 
      message: 'Comentario agregado con éxito',
      comment: populatedComment
    });
  } catch (error) {
    console.error('❌ Error al agregar comentario:', error);
    res.status(500).json({ 
      error: 'Error al agregar comentario',
      message: error.message 
    });
  }
});

// Función recursiva para poblar user en replies anidados
async function populateRepliesUser(comments) {
  for (const comment of comments) {
    if (comment.replies && comment.replies.length > 0) {
      // Buscar los replies completos
      const repliesFull = await Comment.find({ _id: { $in: comment.replies.map(r => r._id || r) } })
        .populate('user', 'name username profilePicture')
        .lean();
      // Recursividad
      await populateRepliesUser(repliesFull);
      comment.replies = repliesFull;
    }
  }
}

// 🧠 Obtener comentarios de una publicación
router.get('/post/:postId', async (req, res) => {
  try {
    // Obtener todos los comentarios del post
    const allComments = await Comment.find({ post: req.params.postId })
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    // Separar comentarios principales y respuestas
    const mainComments = allComments.filter(comment => !comment.parentComment);
    const replies = allComments.filter(comment => comment.parentComment);

    // Asignar respuestas a sus comentarios principales
    const commentsWithReplies = mainComments.map(comment => {
      const commentReplies = replies
        .filter(reply => reply.parentComment.toString() === comment._id.toString())
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return {
        ...comment,
        replies: commentReplies
      };
    });

    // Poblar recursivamente los usuarios en todas las respuestas anidadas
    await populateRepliesUser(commentsWithReplies);

    res.json(commentsWithReplies);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// ✅ Dar like a un comentario
router.post('/:commentId/like', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ 
        error: 'Comentario no encontrado',
        details: { commentId: 'El comentario no existe' }
      });
    }

    if (comment.likes.includes(req.userId)) {
      return res.status(400).json({ 
        error: 'Like ya existe',
        details: { userId: 'Ya has dado like a este comentario' }
      });
    }

    comment.likes.push(req.userId);
    await comment.save();

    res.json({ 
      message: 'Like agregado con éxito',
      comment: {
        _id: comment._id,
        likes: comment.likes
      }
    });
  } catch (error) {
    console.error('❌ Error al dar like:', error);
    res.status(500).json({ 
      error: 'Error al dar like',
      message: error.message 
    });
  }
});

// ✅ Quitar like de un comentario
router.post('/:commentId/unlike', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ 
        error: 'Comentario no encontrado',
        details: { commentId: 'El comentario no existe' }
      });
    }

    if (!comment.likes.includes(req.userId)) {
      return res.status(400).json({ 
        error: 'Like no existe',
        details: { userId: 'No has dado like a este comentario' }
      });
    }

    comment.likes = comment.likes.filter(id => !id.equals(req.userId));
    await comment.save();

    res.json({ 
      message: 'Like eliminado con éxito',
      comment: {
        _id: comment._id,
        likes: comment.likes
      }
    });
  } catch (error) {
    console.error('❌ Error al quitar like:', error);
    res.status(500).json({ 
      error: 'Error al quitar like',
      message: error.message 
    });
  }
});

// ✅ Eliminar un comentario
router.delete('/:commentId', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ 
        error: 'Comentario no encontrado',
        details: { commentId: 'El comentario no existe' }
      });
    }

    if (!comment.user.equals(req.userId)) {
      return res.status(403).json({ 
        error: 'No autorizado',
        details: { userId: 'No tienes permiso para eliminar este comentario' }
      });
    }

    const post = await Post.findById(comment.post);
    if (post) {
      post.comments = post.comments.filter(id => !id.equals(comment._id));
      await post.save();
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comentario eliminado con éxito' });
  } catch (error) {
    console.error('❌ Error al eliminar comentario:', error);
    res.status(500).json({ 
      error: 'Error al eliminar comentario',
      message: error.message 
    });
  }
});

module.exports = router; 