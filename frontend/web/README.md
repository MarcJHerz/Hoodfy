# 🚀 Hoodfy Web Frontend

Frontend web moderno para Hoodfy, construido con Next.js 14, TypeScript y Tailwind CSS.

## ✨ Características

- **🎨 Diseño Moderno**: UI/UX optimizada con Tailwind CSS
- **📱 Responsive**: Funciona perfectamente en todos los dispositivos
- **🌗 Modo Oscuro**: Soporte completo para temas claro y oscuro
- **⚡ Performance**: Optimizado para velocidad y SEO
- **🔐 Autenticación**: Sistema de auth con Firebase
- **💬 Chat en Tiempo Real**: Sistema de chat completo con PostgreSQL y Socket.io
- **🏘️ Comunidades**: Gestión de comunidades y grupos
- **📊 Dashboard**: Panel de control para usuarios y creadores

## 🚀 Sistema de Chat

### Características del Chat
- **💬 Mensajes en tiempo real** con Socket.io
- **👥 Chats privados** entre usuarios
- **🏘️ Chats de comunidad** para grupos
- **📱 Notificaciones** push
- **🎨 Reacciones** a mensajes
- **💬 Respuestas** a mensajes específicos
- **📊 Indicadores** de escritura
- **✅ Estados** de entrega y lectura

### Tecnologías del Chat
- **Backend**: PostgreSQL + Node.js
- **Tiempo Real**: Socket.io
- **Frontend**: React + TypeScript
- **Estado**: Zustand
- **UI**: Tailwind CSS + Heroicons

## 🛠️ Tecnologías

- **Framework**: Next.js 14
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **Autenticación**: Firebase Auth
- **Base de Datos**: PostgreSQL (chat) + MongoDB (principal)
- **Tiempo Real**: Socket.io
- **Iconos**: Heroicons
- **Animaciones**: Framer Motion

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Variables de entorno configuradas

### Pasos
```bash
# Clonar el repositorio
git clone <repo-url>
cd hoodfy/frontend/web

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

## 🔧 Variables de Entorno

### Requeridas
```bash
# Chat API
NEXT_PUBLIC_API_URL=https://api.qahood.com

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
```

### Opcionales
```bash
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## 🚀 Despliegue en Amplify

### Configuración Automática
1. Conecta tu repositorio GitHub a Amplify
2. Configura las variables de entorno en Amplify Console
3. El despliegue se ejecuta automáticamente en cada push

### Variables de Entorno en Amplify
- Ve a **App Settings** → **Environment variables**
- Añade todas las variables requeridas
- Haz redeploy después de configurar

## 📱 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── (dashboard)/       # Rutas protegidas del dashboard
│   │   ├── messages/      # Página de mensajes
│   │   ├── chats/         # Chats individuales
│   │   └── communities/   # Gestión de comunidades
│   ├── auth/              # Autenticación
│   └── layout.tsx         # Layout principal
├── components/            # Componentes reutilizables
│   ├── chat/             # Componentes del chat
│   ├── community/        # Componentes de comunidades
│   └── ui/               # Componentes de UI
├── stores/               # Estado global con Zustand
├── services/             # Servicios y APIs
├── types/                # Tipos TypeScript
└── utils/                # Utilidades y helpers
```

## 💬 Uso del Chat

### Navegación
1. **Ir a mensajes**: `/messages` - Lista de todos los chats
2. **Chat individual**: `/chats/[chatId]` - Chat específico
3. **Nuevo chat**: Desde la página de mensajes

### Funcionalidades
- **Enviar mensajes** en tiempo real
- **Ver indicadores** de escritura
- **Reaccionar** a mensajes con emojis
- **Responder** a mensajes específicos
- **Marcar como leído** automáticamente

## 🔍 Desarrollo

### Scripts Disponibles
```bash
npm run dev          # Desarrollo local
npm run build        # Construir para producción
npm run start        # Servir producción
npm run lint         # Linting
npm run check-env    # Verificar variables de entorno
```

### Verificar Configuración
```bash
npm run check-env
```

## 🚨 Solución de Problemas

### Chat no funciona
1. Verifica que `NEXT_PUBLIC_API_URL` esté configurada
2. Asegúrate de que el backend esté funcionando
3. Revisa la consola del navegador para errores

### Variables de entorno
1. Ejecuta `npm run check-env`
2. Verifica que todas las variables requeridas estén configuradas
3. En Amplify, ve a Environment variables

### CORS errors
1. Verifica que el backend acepte tu dominio
2. Asegúrate de que `NEXT_PUBLIC_API_URL` sea correcta

## 📚 Documentación Adicional

- [Guía de Integración del Chat](./src/components/chat/INTEGRATION_GUIDE.md)
- [Configuración de Amplify](./amplify-env-vars.md)
- [Tipos TypeScript](./src/types/README.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](../../LICENSE) para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
1. Revisa esta documentación
2. Ejecuta `npm run check-env`
3. Revisa los logs de la consola
4. Abre un issue en GitHub

---

**¡Hoodfy está listo para revolucionar la comunicación en tiempo real! 🚀💬**
