const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');
const Subscription = require('../models/Subscription');
const Payout = require('../models/Payout');

// Obtener métricas generales del dashboard
const getDashboardMetrics = async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    // Obtener fecha de hace 30 días para comparaciones
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Métricas de usuarios
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // Métricas de comunidades
    const totalCommunities = await Community.countDocuments();
    const newCommunitiesThisMonth = await Community.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const activeCommunities = await Community.countDocuments({ isActive: true });

    // Métricas de posts
    const totalPosts = await Post.countDocuments();
    const newPostsThisMonth = await Post.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Métricas de suscripciones
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const newSubscriptionsThisMonth = await Subscription.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Métricas financieras
    const totalRevenue = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Subscription.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Cálculo de crecimiento
    const userGrowthRate = totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(2) : 0;
    const communityGrowthRate = totalCommunities > 0 ? ((newCommunitiesThisMonth / totalCommunities) * 100).toFixed(2) : 0;
    const postGrowthRate = totalPosts > 0 ? ((newPostsThisMonth / totalPosts) * 100).toFixed(2) : 0;

    const metrics = {
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        active: activeUsers,
        admin: adminUsers,
        growthRate: parseFloat(userGrowthRate)
      },
      communities: {
        total: totalCommunities,
        newThisMonth: newCommunitiesThisMonth,
        active: activeCommunities,
        growthRate: parseFloat(communityGrowthRate)
      },
      posts: {
        total: totalPosts,
        newThisMonth: newPostsThisMonth,
        growthRate: parseFloat(postGrowthRate)
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        newThisMonth: newSubscriptionsThisMonth
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        monthly: monthlyRevenue[0]?.total || 0
      },
      overview: {
        totalUsers,
        totalCommunities,
        totalPosts,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error obteniendo métricas del dashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener métricas de crecimiento por período
const getGrowthMetrics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    const { period = '30' } = req.query; // días por defecto
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Agregaciones para métricas de crecimiento
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const communityGrowth = await Community.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const postGrowth = await Post.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      period: `${days} días`,
      userGrowth,
      communityGrowth,
      postGrowth
    });
  } catch (error) {
    console.error('Error obteniendo métricas de crecimiento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener análisis de comunidades
const getCommunityAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    // Comunidades más populares por número de miembros
    const topCommunitiesByMembers = await Community.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'communityId',
          as: 'subscriptions'
        }
      },
      {
        $addFields: {
          memberCount: { $size: '$subscriptions' }
        }
      },
      { $sort: { memberCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          description: 1,
          memberCount: 1,
          createdAt: 1,
          isActive: 1
        }
      }
    ]);

    // Comunidades más activas por número de posts
    const topCommunitiesByPosts = await Community.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'communityId',
          as: 'posts'
        }
      },
      {
        $addFields: {
          postCount: { $size: '$posts' }
        }
      },
      { $sort: { postCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          description: 1,
          postCount: 1,
          createdAt: 1,
          isActive: 1
        }
      }
    ]);

    // Estadísticas generales de comunidades
    const communityStats = await Community.aggregate([
      {
        $group: {
          _id: null,
          totalCommunities: { $sum: 1 },
          activeCommunities: { $sum: { $cond: ['$isActive', 1, 0] } },
          avgMembersPerCommunity: { $avg: { $size: '$members' } }
        }
      }
    ]);

    res.json({
      topByMembers: topCommunitiesByMembers,
      topByPosts: topCommunitiesByPosts,
      stats: communityStats[0] || {}
    });
  } catch (error) {
    console.error('Error obteniendo análisis de comunidades:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getDashboardMetrics,
  getGrowthMetrics,
  getCommunityAnalytics
};
