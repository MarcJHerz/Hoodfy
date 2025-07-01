const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');

describe('Auth Endpoints', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Conectar a la base de datos de prueba
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/hoodfy-test');
  });

  afterAll(async () => {
    // Limpiar y desconectar
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpiar la colección de usuarios antes de cada prueba
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Usuario Prueba',
        username: 'usuarioprueba',
        email: 'prueba@ejemplo.com',
        firebaseUid: 'firebase-uid-de-prueba'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Usuario registrado con éxito');
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(userData.email.toLowerCase());
    });

    it('should not register a user with existing email', async () => {
      // Primero creamos un usuario
      const userData = {
        name: 'Usuario Prueba',
        username: 'usuarioprueba',
        email: 'prueba@ejemplo.com',
        firebaseUid: 'firebase-uid-de-prueba'
      };

      await User.create(userData);

      // Intentamos crear otro usuario con el mismo email
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Usuario ya existe');
      expect(res.body.details).toHaveProperty('email');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear un usuario de prueba
      testUser = await User.create({
        name: 'Usuario Prueba',
        username: 'usuarioprueba',
        email: 'prueba@ejemplo.com',
        firebaseUid: 'firebase-uid-de-prueba'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'prueba@ejemplo.com',
          firebaseUid: 'firebase-uid-de-prueba'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);

      // Guardar el token para otras pruebas
      authToken = res.body.token;
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'prueba@ejemplo.com',
          firebaseUid: 'firebase-uid-invalido'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Usuario no encontrado');
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Crear usuario y obtener token
      testUser = await User.create({
        name: 'Usuario Prueba',
        username: 'usuarioprueba',
        email: 'prueba@ejemplo.com',
        firebaseUid: 'firebase-uid-de-prueba'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'prueba@ejemplo.com',
          firebaseUid: 'firebase-uid-de-prueba'
        });

      authToken = loginRes.body.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'No autorizado');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken;

    beforeEach(async () => {
      // Crear usuario y obtener tokens
      testUser = await User.create({
        name: 'Usuario Prueba',
        username: 'usuarioprueba',
        email: 'prueba@ejemplo.com',
        firebaseUid: 'firebase-uid-de-prueba'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'prueba@ejemplo.com',
          firebaseUid: 'firebase-uid-de-prueba'
        });

      refreshToken = loginRes.body.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should not refresh token with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Token inválido');
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Crear usuario y obtener token
      testUser = await User.create({
        name: 'Usuario Prueba',
        username: 'usuarioprueba',
        email: 'prueba@ejemplo.com',
        firebaseUid: 'firebase-uid-de-prueba'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'prueba@ejemplo.com',
          firebaseUid: 'firebase-uid-de-prueba'
        });

      authToken = loginRes.body.token;
    });

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logout exitoso');
    });

    it('should not logout without token', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'No autorizado');
    });
  });
}); 