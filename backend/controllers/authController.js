const login = async (req, res) => {
  try {
    const { firebaseUid } = req.body;
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar la imagen por defecto si es la de Medium
    if (user.profilePicture === 'https://miro.medium.com/v2/resize:fit:1400/format:webp/0*0JcYeLzvORp67c6w.jpg') {
      user.profilePicture = '/images/defaults/default-avatar.png';
      await user.save();
    }

    // Actualizar lastLogin
    await user.updateLastLogin();

    res.json({ user });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}; 