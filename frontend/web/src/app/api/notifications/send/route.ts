import { NextRequest, NextResponse } from 'next/server';
import admin from '@/config/firebase-admin';

// Inicializar Firebase Admin si no está inicializado (ya se maneja en el config)

export async function POST(request: NextRequest) {
  try {
    const { notification, tokens } = await request.json();

    if (!notification || !tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: 'Datos de notificación inválidos' },
        { status: 400 }
      );
    }

    // Enviar notificación a múltiples tokens
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: tokens,
    };

    // @ts-ignore - Temporal para deployment
    const response = await admin.messaging().sendMulticast(message);

    console.log(`✅ Notificaciones enviadas: ${response.successCount}/${tokens.length}`);

    if (response.failureCount > 0) {
      console.warn('⚠️ Algunas notificaciones fallaron:', response.responses);
    }

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Error enviando notificaciones:', err.message || error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 