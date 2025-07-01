# Stores de Zustand - Hoodfy

Esta carpeta contiene todos los stores de Zustand para la gestión centralizada del estado en Hoodfy.

## 📁 Estructura

```
stores/
├── authStore.ts      # Autenticación y usuario actual
├── postsStore.ts     # Posts, likes, comentarios
├── communitiesStore.ts # Comunidades y suscripciones
├── uiStore.ts        # Modales, notificaciones, UI
├── userStore.ts      # Perfiles de usuario
└── index.ts          # Exportaciones centralizadas
```

## 🔧 Stores Disponibles

### 1. AuthStore (`useAuthStore`)

**Propósito**: Gestión de autenticación con Firebase + JWT

**Estado**:
- `user`: Usuario actual (User | null)
- `token`: Token JWT (string | null)
- `isLoading`: Estado de carga
- `error`: Mensaje de error

**Funciones**:
- `login(email, password)`: Iniciar sesión
- `register(name, email, password)`: Registrarse
- `logout()`: Cerrar sesión
- `setUser(user)`: Establecer usuario
- `setToken(token)`: Establecer token
- `clearError()`: Limpiar errores

**Ejemplo de uso**:
```tsx
import { useAuthStore } from '@/stores';

const { user, login, isLoading, error } = useAuthStore();

const handleLogin = async () => {
  await login('user@example.com', 'password');
};
```

### 2. PostsStore (`usePostsStore`)

**Propósito**: Gestión de posts, likes y comentarios

**Estado**:
- `feedPosts`: Posts del feed principal
- `communityPosts`: Posts por comunidad
- `userPosts`: Posts por usuario
- `currentPost`: Post actual
- `isLoading*`: Estados de carga
- `error`: Mensaje de error

**Funciones**:
- `loadHomeFeed(userId)`: Cargar feed principal
- `loadCommunityPosts(communityId, sort)`: Cargar posts de comunidad
- `likePost(postId, userId)`: Dar like
- `unlikePost(postId, userId)`: Quitar like
- `addComment(postId, content)`: Agregar comentario
- `updatePostInStore(post)`: Actualizar post en store

**Ejemplo de uso**:
```tsx
import { usePostsStore } from '@/stores';

const { feedPosts, likePost, loadHomeFeed } = usePostsStore();

useEffect(() => {
  if (user) {
    loadHomeFeed(user._id);
  }
}, [user]);

const handleLike = () => {
  likePost(post._id, user._id);
};
```

### 3. CommunitiesStore (`useCommunitiesStore`)

**Propósito**: Gestión de comunidades y suscripciones

**Estado**:
- `allCommunities`: Todas las comunidades
- `userCommunities`: Comunidades del usuario
- `subscribedCommunities`: Comunidades suscritas
- `currentCommunity`: Comunidad actual
- `subscriptions`: Suscripciones activas
- `subscribers`: Suscriptores por comunidad

**Funciones**:
- `loadAllCommunities()`: Cargar todas las comunidades
- `loadUserCommunities(userId)`: Cargar comunidades del usuario
- `subscribeToCommunity(communityId, amount, paymentMethod)`: Suscribirse
- `checkSubscription(communityId)`: Verificar suscripción

### 4. UIStore (`useUIStore`)

**Propósito**: Estado global de UI (modales, notificaciones, etc.)

**Estado**:
- `isCreatePostModalOpen`: Modal de crear post
- `isCommentsModalOpen`: Modal de comentarios
- `isSearchModalOpen`: Modal de búsqueda
- `isGlobalLoading`: Loading global
- `notifications`: Notificaciones activas

**Funciones**:
- `openCreatePostModal()`: Abrir modal crear post
- `closeCreatePostModal()`: Cerrar modal crear post
- `addNotification(notification)`: Agregar notificación
- `setGlobalLoading(loading, message)`: Establecer loading global

### 5. UserStore (`useUserStore`)

**Propósito**: Gestión de perfiles de usuario

**Estado**:
- `currentUser`: Usuario actual
- `userProfiles`: Perfiles de usuarios por ID
- `isLoading*`: Estados de carga
- `error`: Mensaje de error

**Funciones**:
- `loadCurrentUserProfile()`: Cargar perfil actual
- `loadUserProfile(userId)`: Cargar perfil de usuario
- `updateProfile(formData)`: Actualizar perfil
- `followUser(userId)`: Seguir usuario
- `unfollowUser(userId)`: Dejar de seguir

## 🚀 Migración de Componentes

### Antes (AuthContext):
```tsx
import { useAuth } from '@/contexts/AuthContext';

const { user, login, loading } = useAuth();
```

### Después (AuthStore):
```tsx
import { useAuthStore } from '@/stores';

const { user, login, isLoading } = useAuthStore();
```

### Antes (Props Drilling):
```tsx
const PostCard = ({ post, onLike, onComment, currentUser }) => {
  // Lógica local
};
```

### Después (Stores):
```tsx
import { useAuthStore, usePostsStore, useUIStore } from '@/stores';

const PostCard = ({ post }) => {
  const { user: currentUser } = useAuthStore();
  const { likePost } = usePostsStore();
  const { openCommentsModal } = useUIStore();
  
  // Lógica centralizada
};
```

## 📋 Mejores Prácticas

### 1. Selectores Específicos
```tsx
// ✅ Bueno - Solo se re-renderiza cuando cambia user
const user = useAuthStore(state => state.user);

// ❌ Malo - Se re-renderiza cuando cambia cualquier cosa
const { user, token, isLoading, error } = useAuthStore();
```

### 2. Múltiples Stores
```tsx
// ✅ Bueno - Usar múltiples stores según necesidad
const { user } = useAuthStore();
const { feedPosts } = usePostsStore();
const { openModal } = useUIStore();
```

### 3. Persistencia
Los stores con persistencia automática:
- `authStore`: Usuario y token
- `postsStore`: Posts del feed
- `communitiesStore`: Comunidades y suscripciones
- `userStore`: Perfiles de usuario

### 4. Manejo de Errores
```tsx
const { error, clearError } = useAuthStore();

useEffect(() => {
  if (error) {
    toast.error(error);
    clearError();
  }
}, [error]);
```

## 🔄 Integración con Firebase

El AuthStore mantiene la integración con Firebase:
- Escucha `onAuthStateChanged`
- Sincroniza usuario y token automáticamente
- Maneja login/logout con Firebase + backend
- Preparado para notificaciones push futuras

## 🎯 Beneficios de la Migración

1. **Estado Centralizado**: Sin props drilling
2. **Persistencia Automática**: Estado sobrevive a recargas
3. **Mejor Performance**: Re-renders optimizados
4. **Código Más Limpio**: Lógica separada por dominio
5. **Escalabilidad**: Fácil agregar nuevos stores
6. **TypeScript**: Tipado fuerte en todo el estado

## 🚧 Próximos Pasos

1. Migrar componentes restantes
2. Implementar selectores optimizados
3. Agregar middleware para logging
4. Integrar con Socket.io para chat
5. Implementar notificaciones push 