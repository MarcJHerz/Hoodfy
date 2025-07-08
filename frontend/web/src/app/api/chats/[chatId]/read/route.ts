import { NextRequest, NextResponse } from 'next/server';
import admin from '@/config/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    // Obtener usuario autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    // @ts-ignore - Temporal para deployment
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Marcar mensajes como leídos
    await markMessagesAsRead(chatId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marcando mensajes como leídos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function markMessagesAsRead(chatId: string, userId: string) {
  try {
    const { db } = require('@/config/firebase-admin');
    
    // Actualizar el contador de mensajes no leídos
    await db.collection('chats').doc(chatId).update({
      [`unreadCount.${userId}`]: 0,
    });

    console.log(`Mensajes marcados como leídos para usuario ${userId} en chat ${chatId}`);
  } catch (error) {
    console.error('Error marcando mensajes como leídos en Firestore:', error);
    throw error;
  }
} 