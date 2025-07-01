# Sistema de Chat - Hoodfy

## Descripción

El sistema de chat de Hoodfy permite a los usuarios comunicarse en tiempo real dentro de las comunidades y con otros aliados. El sistema está construido con Firebase Firestore para la sincronización en tiempo real y Zustand para el manejo de estado.

## Características

### Chat de Comunidad
- **Acceso restringido**: Solo usuarios suscritos a la comunidad pueden acceder
- **Chat grupal**: Todos los miembros suscritos pueden participar
- **Tiempo real**: Mensajes sincronizados instantáneamente
- **Multimedia**: Soporte para texto, imágenes, videos y archivos

### Chat Privado
- **Entre aliados**: Solo usuarios que comparten al menos una comunidad
- **Chat individual**: Conversaciones uno a uno
- **Notificaciones**: Alertas push para nuevos mensajes

## Componentes

### Core Components

#### `ChatRoom`
Componente principal que integra la lista de mensajes y el input de envío.

```tsx
<ChatRoom
  chatId="chat-123"
  chatName="Mi Comunidad"
  chatType="community"
  onClose={() => {}}
/>
```

#### `MessageList`
Muestra la lista de mensajes con scroll automático y estados de carga.

```tsx
<MessageList
  messages={messages}
  isLoading={false}
  currentUserId="user-123"
  onMessageClick={(message) => {}}
/>
```

#### `MessageInput`
Input para enviar mensajes con soporte para archivos.

```tsx
<MessageInput
  onSendMessage={(content, type, file) => {}}
  isLoading={false}
  placeholder="Escribe un mensaje..."
/>
```

### Modal Components

#### `CommunityChatModal`
Modal para mostrar el chat de comunidad con verificación de suscripción.

```tsx
<CommunityChatModal
  isOpen={true}
  onClose={() => {}}
  communityId="community-123"
  communityName="Mi Comunidad"
/>
```

#### `CommunityChatRoom`
Componente para mostrar el chat como página o tab.

```tsx
<CommunityChatRoom
  communityId="community-123"
  communityName="Mi Comunidad"
/>
```

### Utility Components

#### `ChatConnectionStatus`
Indicador del estado de conexión del chat.

#### `TypingIndicator`
Muestra cuando usuarios están escribiendo.

## Stores

### `chatStore`
Maneja el estado global del chat usando Zustand.

```tsx
const {
  messages,
  isLoading,
  error,
  connectionStatus,
  sendMessage,
  subscribeToMessages
} = useChatStore();
```

## Servicios

### `chatService`
Servicio para operaciones con Firestore.

```tsx
// Enviar mensaje
await chatService.sendMessage(messageData);

// Suscribirse a mensajes
const unsubscribe = chatService.subscribeToMessages(chatId, callback);

// Crear chat de comunidad
const chat = await chatService.createOrGetCommunityChat(communityId, name);
```

## Tipos

### `Message`
```tsx
interface Message {
  id: string;
  chatId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  mediaType?: string;
  mediaName?: string;
  isEdited?: boolean;
  editedAt?: Date;
}
```

### `ChatRoom`
```tsx
interface ChatRoom {
  id: string;
  name: string;
  type: 'community' | 'private';
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
  createdAt: Date;
}
```

## Integración

### En Página de Comunidad
```tsx
// En communities/[id]/page.tsx
const [isChatModalOpen, setIsChatModalOpen] = useState(false);

// Botón para abrir chat
<button onClick={() => setIsChatModalOpen(true)}>
  Abrir Chat Grupal
</button>

// Modal del chat
<CommunityChatModal
  isOpen={isChatModalOpen}
  onClose={() => setIsChatModalOpen(false)}
  communityId={communityId}
  communityName={communityName}
/>
```

### Como Tab en Comunidad
```tsx
// Agregar tab de chat
{activeTab === 'chat' && (
  <CommunityChatRoom
    communityId={communityId}
    communityName={communityName}
  />
)}
```

## Seguridad

### Reglas de Firestore
- Solo usuarios autenticados pueden acceder
- Usuarios solo pueden leer/escribir en chats donde son participantes
- Para chats de comunidad, verificación de suscripción en backend
- Para chats privados, verificación de relación de aliados

### Verificaciones
- **Suscripción**: Usuario debe estar suscrito a la comunidad
- **Aliados**: Para chats privados, usuarios deben compartir al menos una comunidad
- **Autenticación**: Usuario debe estar autenticado

## Notificaciones

### Firebase Messaging
- Notificaciones push para nuevos mensajes
- Configuración automática de permisos
- Manejo de tokens de notificación

### Hook `useChatNotifications`
```tsx
const { requestPermission, isSupported } = useChatNotifications({
  enabled: true,
  onNewMessage: (message) => {
    // Manejar nuevo mensaje
  }
});
```

## Configuración

### Variables de Entorno
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

## Uso

1. **Configurar Firebase**: Asegurar que Firestore esté habilitado
2. **Configurar reglas**: Aplicar las reglas de seguridad de Firestore
3. **Integrar componentes**: Usar los componentes en las páginas deseadas
4. **Configurar notificaciones**: Habilitar Firebase Messaging
5. **Probar funcionalidad**: Verificar que los chats funcionen correctamente

## Consideraciones

- **Rendimiento**: Los mensajes se cargan en lotes para optimizar rendimiento
- **Offline**: Firestore maneja automáticamente el estado offline
- **Escalabilidad**: El sistema está diseñado para manejar múltiples chats simultáneos
- **Privacidad**: Solo usuarios autorizados pueden acceder a los chats 