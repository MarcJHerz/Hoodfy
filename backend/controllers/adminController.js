const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');
const Subscription = require('../models/Subscription');

/**
 * Obtener todos los usuarios para el dashboard de admin
 * Incluye estadísticas de comunidades, posts y suscripciones
 */
const getAllUsers = async (req, res) => {
  try {
    
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado', 
        message: 'Solo los administradores pueden acceder a esta información' 
      });
    }

    // Obtener todos los usuarios con información básica
    const users = await User.find({})
      .select('email username displayName role status createdAt lastLogin')
      .sort({ createdAt: -1 });


    // Obtener estadísticas para cada usuario
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        try {
          // Contar comunidades creadas por el usuario
          const communitiesCount = await Community.countDocuments({ 
            creator: user._id 
          });

          // Contar posts creados por el usuario
          const postsCount = await Post.countDocuments({ 
            author: user._id 
          });

          // Contar suscripciones activas del usuario
          const activeSubscriptionsCount = await Subscription.countDocuments({
            userId: user._id,
            status: 'active'
          });

          // Obtener la última actividad (último post o última suscripción)
          const lastPost = await Post.findOne({ author: user._id })
            .sort({ createdAt: -1 })
            .select('createdAt');

          const lastSubscription = await Subscription.findOne({ userId: user._id })
            .sort({ createdAt: -1 })
            .select('createdAt');

          const lastActivity = lastPost?.createdAt || lastSubscription?.createdAt || user.createdAt;

          return {
            id: user._id,
            email: user.email,
            username: user.username || user.displayName || 'Sin nombre',
            displayName: user.displayName || 'Sin nombre',
            role: user.role || 'user',
            status: user.status || 'active',
            createdAt: user.createdAt,
            lastLogin: user.lastLogin || user.createdAt,
            lastActivity: lastActivity,
            communitiesCount,
            postsCount,
            activeSubscriptionsCount,
            // Información adicional para admin
            isVerified: user.isVerified || false,
            profileComplete: !!(user.displayName && user.username),
            // Calcular días desde el registro
            daysSinceRegistration: Math.floor(
              (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            )
          };
        } catch (error) {
          // Retornar usuario con estadísticas básicas en caso de error
          return {
            id: user._id,
            email: user.email,
            username: user.username || user.displayName || 'Sin nombre',
            displayName: user.displayName || 'Sin nombre',
            role: user.role || 'user',
            status: user.status || 'active',
            createdAt: user.createdAt,
            lastLogin: user.lastLogin || user.createdAt,
            lastActivity: user.createdAt,
            communitiesCount: 0,
            postsCount: 0,
            activeSubscriptionsCount: 0,
            isVerified: user.isVerified || false,
            profileComplete: !!(user.displayName && user.username),
            daysSinceRegistration: 0,
            error: 'Error obteniendo estadísticas'
          };
        }
      })
    );


    res.json({
      success: true,
      users: usersWithStats,
      total: usersWithStats.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los usuarios'
    });
  }
};

/**
 * Obtener estadísticas generales de usuarios para el dashboard
 */
const getUserStats = async (req, res) => {
  try {
    
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado', 
        message: 'Solo los administradores pueden acceder a esta información' 
      });
    }

    // Estadísticas generales
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ status: 'active' });
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const moderatorUsers = await User.countDocuments({ role: 'moderator' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // Usuarios por período
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: last7Days } });
    const newUsersLast30Days = await User.countDocuments({ createdAt: { $gte: last30Days } });
    const newUsersLast90Days = await User.countDocuments({ createdAt: { $gte: last90Days } });

    // Usuarios verificados
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = totalUsers - verifiedUsers;

    // Usuarios con perfil completo
    const usersWithCompleteProfile = await User.countDocuments({
      $and: [
        { displayName: { $exists: true, $ne: null, $ne: '' } },
        { username: { $exists: true, $ne: null, $ne: '' } }
      ]
    });

    res.json({
      success: true,
      stats: {
        total: totalUsers,
        byStatus: {
          active: activeUsers,
          banned: bannedUsers
        },
        byRole: {
          admin: adminUsers,
          moderator: moderatorUsers,
          user: regularUsers
        },
        byPeriod: {
          last7Days: newUsersLast7Days,
          last30Days: newUsersLast30Days,
          last90Days: newUsersLast90Days
        },
        verification: {
          verified: verifiedUsers,
          unverified: unverifiedUsers
        },
        profile: {
          complete: usersWithCompleteProfile,
          incomplete: totalUsers - usersWithCompleteProfile
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas'
    });
  }
};

/**
 * Cambiar el rol de un usuario
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    
    if (!userId || !newRole) {
      return res.status(400).json({ 
        error: 'Datos incompletos', 
        message: 'Se requiere userId y newRole' 
      });
    }

    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado', 
        message: 'Solo los administradores pueden cambiar roles' 
      });
    }

    // Validar rol
    const validRoles = ['user', 'moderator', 'admin'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ 
        error: 'Rol inválido', 
        message: 'El rol debe ser user, moderator o admin' 
      });
    }

    // No permitir cambiar el rol del usuario actual
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        error: 'Operación no permitida', 
        message: 'No puedes cambiar tu propio rol' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    ).select('email username role status');

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }


    res.json({
      success: true,
      message: `Rol de usuario actualizado a ${newRole}`,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el rol del usuario'
    });
  }
};

/**
 * Cambiar el estado de un usuario (banear/activar)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { userId, newStatus } = req.body;
    
    if (!userId || !newStatus) {
      return res.status(400).json({ 
        error: 'Datos incompletos', 
        message: 'Se requiere userId y newStatus' 
      });
    }

    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado', 
        message: 'Solo los administradores pueden cambiar estados' 
      });
    }

    // Validar estado
    const validStatuses = ['active', 'banned', 'suspended'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ 
        error: 'Estado inválido', 
        message: 'El estado debe ser active, banned o suspended' 
      });
    }

    // No permitir cambiar el estado del usuario actual
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        error: 'Operación no permitida', 
        message: 'No puedes cambiar tu propio estado' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status: newStatus },
      { new: true }
    ).select('email username role status');

    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }


    res.json({
      success: true,
      message: `Estado de usuario actualizado a ${newStatus}`,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el estado del usuario'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserStats,
  updateUserRole,
  updateUserStatus
};
