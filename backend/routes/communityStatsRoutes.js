const express = require('express');
const router = express.Router();
const CommunityStats = require('../models/CommunityStats');
const Community = require('../models/Community');
const Post = require('../models/Post');
const { verifyToken } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// 🔹 Obtener estadísticas de una comunidad
router.get('/:communityId', verifyToken, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    // Verificar si el usuario es el creador
    if (community.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para ver estas estadísticas' });
    }

    let stats = await CommunityStats.findOne({ communityId: req.params.communityId });
    
    if (!stats) {
      // Si no existen estadísticas, calcularlas
      const totalMembers = community.members.length;
      const activeMembers = await Post.distinct('user', { community: req.params.communityId });
      
      // Calcular posts por día (últimos 7 días)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentPosts = await Post.countDocuments({
        community: req.params.communityId,
        createdAt: { $gte: sevenDaysAgo }
      });
      const postsPerDay = recentPosts / 7;

      // Calcular engagement rate (likes + comentarios / total de posts)
      const totalPosts = await Post.countDocuments({ community: req.params.communityId });
      const totalEngagement = await Post.aggregate([
        { $match: { community: mongoose.Types.ObjectId(req.params.communityId) } },
        { $project: { engagement: { $add: ['$likes', { $size: '$comments' }] } } },
        { $group: { _id: null, total: { $sum: '$engagement' } } }
      ]);

      const engagementRate = totalPosts > 0 ? (totalEngagement[0]?.total || 0) / totalPosts : 0;

      // Obtener nuevos miembros esta semana
      const newMembersThisWeek = community.members.filter(member => {
        const joinDate = new Date(member.joinDate);
        return joinDate >= sevenDaysAgo;
      }).length;

      // Obtener contenido popular
      const popularContent = await Post.find({ community: req.params.communityId })
        .sort({ likes: -1 })
        .limit(5)
        .select('_id');

      stats = new CommunityStats({
        communityId: req.params.communityId,
        totalMembers,
        activeMembers: activeMembers.length,
        postsPerDay,
        engagementRate,
        newMembersThisWeek,
        popularContent: popularContent.map(post => ({
          postId: post._id,
          engagement: post.likes
        }))
      });

      await stats.save();
    }

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// 🔹 Actualizar estadísticas de una comunidad
router.post('/update/:communityId', verifyToken, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    // Verificar si el usuario es el creador
    if (community.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar estas estadísticas' });
    }

    // Forzar actualización de estadísticas
    const stats = await CommunityStats.findOneAndUpdate(
      { communityId: req.params.communityId },
      { $set: { lastUpdated: new Date() } },
      { new: true }
    );

    res.json({ message: 'Estadísticas actualizadas', stats });
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    res.status(500).json({ error: 'Error al actualizar estadísticas' });
  }
});

module.exports = router; 