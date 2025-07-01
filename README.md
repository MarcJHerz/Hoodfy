# 🏘️ Hoodfy - Plataforma Social Exclusiva

> **Plataforma social donde usuarios pagan para acceder a comunidades exclusivas**

Hoodfy es una plataforma social innovadora que conecta personas a través de comunidades premium. Los usuarios pueden descubrir, unirse y participar en comunidades exclusivas mediante suscripciones pagadas, creando un ecosistema de valor agregado.

## ✨ Características Principales

### 🏛️ **Comunidades Premium**
- Comunidades exclusivas con suscripción pagada
- Sistema de administración y moderación
- Estadísticas detalladas de engagement
- Banners personalizados y branding

### 💬 **Sistema de Chat Avanzado**
- **Chat grupal** en comunidades
- **Chat privado** entre "aliados" (conexiones)
- Mensajería en tiempo real con Firebase
- Soporte multimedia (imágenes, videos, archivos)
- Indicadores de escritura y lectura
- Modo oscuro y UI moderna

### 📱 **Contenido y Posts**
- Feed personalizado por comunidad
- Subida de multimedia (imágenes, videos)
- Sistema de comentarios anidados
- Moderación de contenido
- Etiquetas y categorización

### 🔐 **Autenticación y Seguridad**
- Autenticación con Firebase
- Gestión de perfiles y avatares
- Sistema de "aliados" (conexiones sociales)
- Control de acceso basado en suscripciones

## 🛠️ Stack Tecnológico

### **Backend**
- **Node.js** + **Express.js**
- **MongoDB** (Mongoose ODM)
- **Firebase Admin SDK**
- **Multer** para subida de archivos
- **Jest** para testing
- **Rate limiting** y middleware de seguridad

### **Frontend Web**
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** + modo oscuro
- **Zustand** para gestión de estado
- **Firebase SDK** para auth y real-time
- **PWA** con notificaciones push

### **Frontend Móvil**
- **React Native** + **Expo**
- **TypeScript**
- **Firebase SDK**
- **Cross-platform** (iOS + Android)

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+
- MongoDB
- Firebase Project
- Git

### **1. Clonar el repositorio**
```bash
git clone https://github.com/marcherz/hoodfy.git
cd hoodfy
```

### **2. Configurar Backend**
```bash
cd backend
npm install
```

**Crear archivo `.env`:**
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/hoodfy

# Firebase
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-clave-privada\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu-client-id

# JWT
JWT_SECRET=tu-jwt-secret-muy-seguro

# Server
PORT=5000
NODE_ENV=development
```

**Iniciar backend:**
```bash
npm run dev
```

### **3. Configurar Frontend Web**
```bash
cd frontend/web
npm install
```

**Crear archivo `.env.local`:**
```env
# Firebase Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-firebase
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Iniciar frontend web:**
```bash
npm run dev
```

### **4. Configurar Frontend Móvil**
```bash
cd frontend/mobile
npm install
```

**Iniciar app móvil:**
```bash
npx expo start
```

## 📁 Estructura del Proyecto

```
hoodfy/
├── backend/                 # API Backend (Node.js + Express)
│   ├── controllers/         # Controladores de rutas
│   ├── models/             # Modelos de MongoDB
│   ├── routes/             # Definición de rutas
│   ├── middleware/         # Middleware personalizado
│   ├── config/             # Configuraciones (DB, Firebase)
│   ├── utils/              # Utilidades y helpers
│   └── uploads/            # Archivos subidos (gitignored)
├── frontend/
│   ├── web/                # App Web (Next.js)
│   │   ├── src/app/        # App Router de Next.js
│   │   ├── src/components/ # Componentes React
│   │   ├── src/stores/     # Estados globales (Zustand)
│   │   └── src/services/   # Servicios y APIs
│   └── mobile/             # App Móvil (React Native + Expo)
│       ├── src/screens/    # Pantallas de la app
│       ├── src/components/ # Componentes reutilizables
│       └── src/config/     # Configuraciones móviles
└── README.md
```

## 🎯 Funcionalidades Principales

### **Para Usuarios**
- 🔍 Descubrir comunidades por categorías
- 💳 Suscribirse a comunidades premium
- 💬 Participar en chats grupales y privados
- 📝 Crear y compartir posts
- 👥 Conectar con otros usuarios ("aliados")
- 🔔 Recibir notificaciones en tiempo real

### **Para Administradores de Comunidades**
- 🏗️ Crear y personalizar comunidades
- 👑 Gestionar miembros y moderadores
- 📊 Ver estadísticas de engagement
- 🎨 Personalizar branding y banners
- 💰 Gestionar suscripciones y precios

## 🚀 Roadmap

- [ ] **Sistema de pagos** con Stripe
- [ ] **Notificaciones push** avanzadas
- [ ] **Video llamadas** en comunidades
- [ ] **Marketplace** para servicios entre miembros
- [ ] **Analytics** detallados para administradores
- [ ] **App nativa** para iOS/Android

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👤 Autor

**Marc Hernández**
- GitHub: [@marcherz](https://github.com/marcherz)
- Email: marchernandezgar@gmail.com

---

⭐ Si este proyecto te resulta útil, ¡dale una estrella!
