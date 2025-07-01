const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Community = require('../models/Community');
const { verifyToken } = require('../middleware/authMiddleware');
const Ally = require('../models/Ally');

// 📁 Crear carpeta si no existe
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// 📷 Configuración de multer para imágenes de portada
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = 'uploads/banners';
    ensureDir(folder);
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName.endsWith(ext) ? uniqueName : uniqueName + ext);
  }
});

const upload = multer({ storage });

// 🔹 Función para hacer aliados automáticamente
const makeAllies = async (userId, communityId) => {
  try {
    // Obtener todos los miembros de la comunidad
    const community = await Community.findById(communityId).populate('members', '_id');
    const members = community.members.map(m => m._id);

    // Crear relaciones de aliados con cada miembro
    for (const memberId of members) {
      if (memberId.toString() !== userId.toString()) {
        // Verificar si ya son aliados en cualquier dirección
        const existingAlly = await Ally.findOne({
          $or: [
            { user1: userId, user2: memberId },
            { user1: memberId, user2: userId }
          ]
        });

        if (!existingAlly) {
          // Crear relación unidireccional
          await new Ally({
            user1: userId,
            user2: memberId
          }).save();
          console.log(`✅ Relación de aliados creada entre ${userId} y ${memberId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error al crear aliados automáticamente:', error);
  }
};

// 🔍 Buscar comunidades por palabra clave (nombre o descripción)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({ error: 'Debes proporcionar una palabra clave para buscar.' });
    }
    const regex = new RegExp(q, 'i');
    const communities = await Community.find({
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } }
      ]
    })
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });
    res.json(communities);
  } catch (error) {
    console.error('Error al buscar comunidades:', error);
    res.status(500).json({ error: 'Error al buscar comunidades' });
  }
});

// ✅ Crear una nueva comunidad
router.post('/create', verifyToken, upload.single('coverImage'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user._id;

    // Verificar si ya existe una comunidad con el mismo nombre
    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({ error: 'Ya existe una comunidad con este nombre' });
    }

    // Procesar la imagen si existe
    let coverImage = '';
    if (req.file) {
      coverImage = req.file.path;
    }

    // Crear la nueva comunidad
    const community = new Community({
      name,
      description,
      coverImage,
      creator: userId,
      members: [userId]
    });

    await community.save();

    res.status(201).json({
      message: 'Comunidad creada exitosamente',
      community
    });
  } catch (error) {
    console.error('Error al crear comunidad:', error);
    res.status(500).json({ error: 'Error al crear la comunidad' });
  }
});

// ✅ Obtener todas las comunidades
router.get('/', async (req, res) => {
  try {
    const communities = await Community.find()
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });
    res.json(communities);
  } catch (error) {
    console.error('Error al obtener comunidades:', error);
    res.status(500).json({ error: 'Error al obtener las comunidades' });
  }
});

// ✅ Obtener una comunidad específica
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'name email profilePicture')
      .populate('members', 'name email profilePicture');
    
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    // Verificar si el usuario es miembro
    const isMember = community.members.some(member => member._id.toString() === req.userId.toString());
    // Verificar si el usuario es el creador
    const isCreator = community.creator._id.toString() === req.userId.toString();
    
    // Convertir a objeto plano para poder modificarlo
    const communityObj = community.toObject();
    // Agregar información de membresía
    communityObj.isMember = isMember || isCreator;
    communityObj.isCreator = isCreator;
    
    res.json(communityObj);
  } catch (error) {
    console.error('Error al obtener comunidad:', error);
    res.status(500).json({ error: 'Error al obtener la comunidad' });
  }
});

// 🧠 Obtener comunidades creadas por usuario
router.get('/created-by/:userId', async (req, res) => {
  try {
    const communities = await Community.find({ creator: req.params.userId })
      .populate('creator', 'name profilePicture')
      .populate('members', 'name profilePicture');

    // Formatear las URLs de las imágenes
    const formattedCommunities = communities.map(community => {
      const formattedCommunity = community.toObject();
      if (formattedCommunity.coverImage && !formattedCommunity.coverImage.startsWith('http')) {
        formattedCommunity.coverImage = `${process.env.BASE_URL || 'http://192.168.1.87:5000'}/${formattedCommunity.coverImage.replace(/^\//, '')}`;
      }
      return formattedCommunity;
    });

    res.json(formattedCommunities);
  } catch (error) {
    console.error('❌ Error al obtener comunidades creadas:', error);
    res.status(500).json({ error: 'Error al obtener comunidades creadas' });
  }
});

// ✅ Unirse a una comunidad
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    if (community.members.includes(req.user._id)) {
      return res.status(400).json({ error: 'Ya eres miembro de esta comunidad' });
    }

    await community.addMember(req.user._id);
    // Crear aliados automáticamente
    await makeAllies(req.user._id, community._id);
    res.json({ message: 'Te has unido a la comunidad exitosamente' });
  } catch (error) {
    console.error('Error al unirse a la comunidad:', error);
    res.status(500).json({ error: 'Error al unirse a la comunidad' });
  }
});

// ✅ Salir de una comunidad
router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    if (community.creator.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: 'El creador no puede salir de la comunidad' });
    }

    if (!community.members.includes(req.user._id)) {
      return res.status(400).json({ error: 'No eres miembro de esta comunidad' });
    }

    // Guardar los miembros actuales antes de salir
    const miembrosAntes = community.members.filter(id => id.toString() !== req.user._id.toString());

    await community.removeMember(req.user._id);

    // Lógica avanzada: eliminar aliados si ya no comparten ninguna comunidad
    for (const miembroId of miembrosAntes) {
      // Buscar si ambos usuarios comparten alguna otra comunidad
      const compartenOtra = await Community.exists({
        members: { $all: [req.user._id, miembroId] },
        _id: { $ne: community._id }
      });
      if (!compartenOtra) {
        // Eliminar la relación Ally en cualquier dirección
        await Ally.findOneAndDelete({
          $or: [
            { user1: req.user._id, user2: miembroId },
            { user1: miembroId, user2: req.user._id }
          ]
        });
      }
    }

    res.json({ message: 'Has salido de la comunidad exitosamente' });
  } catch (error) {
    console.error('Error al salir de la comunidad:', error);
    res.status(500).json({ error: 'Error al salir de la comunidad' });
  }
});

// 🔹 Eliminar una comunidad
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ error: 'Comunidad no encontrada' });

    if (!community.creator.equals(req.userId)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta comunidad' });
    }

    await Community.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comunidad eliminada con éxito' });
  } catch (error) {
    console.error('❌ Error al eliminar la comunidad:', error);
    res.status(500).json({ error: 'Error al eliminar la comunidad' });
  }
});

// ✅ Actualizar una comunidad
router.put('/:id/update', verifyToken, upload.single('coverImage'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    // Verificar que el usuario sea el creador
    if (community.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta comunidad' });
    }

    // Actualizar campos
    if (name) community.name = name;
    if (description) community.description = description;
    if (req.file) community.coverImage = req.file.path;

    await community.save();

    res.json({
      message: 'Comunidad actualizada exitosamente',
      community
    });
  } catch (error) {
    console.error('Error al actualizar comunidad:', error);
    res.status(500).json({ error: 'Error al actualizar la comunidad' });
  }
});

// 🔹 Obtener comunidades a las que se ha unido el usuario autenticado
router.get('/joined-by/me', verifyToken, async (req, res) => {
  try {
    const communities = await Community.find({ 
      members: req.userId,
      creator: { $ne: req.userId } // Excluir comunidades donde el usuario es el creador
    })
    .populate('creator', 'name profilePicture')
    .populate('members', 'name profilePicture');

    // Formatear las URLs de las imágenes
    const formattedCommunities = communities.map(community => {
      const formattedCommunity = community.toObject();
      if (formattedCommunity.coverImage && !formattedCommunity.coverImage.startsWith('http')) {
        formattedCommunity.coverImage = `${process.env.BASE_URL || 'http://192.168.1.87:5000'}/${formattedCommunity.coverImage.replace(/^\//, '')}`;
      }
      return formattedCommunity;
    });
    
    res.json(formattedCommunities);
  } catch (error) {
    console.error('❌ Error al obtener comunidades unidas:', error);
    res.status(500).json({ error: 'Error al obtener comunidades unidas' });
  }
});

// 🔹 Obtener comunidades a las que se ha unido un usuario
router.get('/joined-by/:userId', async (req, res) => {
  try {
    const communities = await Community.find({ 
      members: req.params.userId,
      creator: { $ne: req.params.userId } // Excluir comunidades donde el usuario es el creador
    })
    .populate('creator', 'name profilePicture')
    .populate('members', 'name profilePicture');

    // Formatear las URLs de las imágenes
    const formattedCommunities = communities.map(community => {
      const formattedCommunity = community.toObject();
      if (formattedCommunity.coverImage && !formattedCommunity.coverImage.startsWith('http')) {
        formattedCommunity.coverImage = `${process.env.BASE_URL || 'http://192.168.1.87:5000'}/${formattedCommunity.coverImage.replace(/^\//, '')}`;
      }
      return formattedCommunity;
    });
    
    res.json(formattedCommunities);
  } catch (error) {
    console.error('❌ Error al obtener comunidades unidas:', error);
    res.status(500).json({ error: 'Error al obtener comunidades unidas' });
  }
});

module.exports = router;
module.exports.makeAllies = makeAllies; 