import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Solo aplicar middleware a rutas específicas
  const path = request.nextUrl.pathname;
  
  // Lista de rutas que NO necesitan middleware (públicas)
  const publicPaths = [
    '/', 
    '/login', 
    '/register', 
    '/api',
    '/communities', // ✅ Permitir acceso público a comunidades
    '/communities/', // ✅ Permitir acceso público a comunidades específicas
    '/profile/', // ✅ Permitir acceso público a perfiles
    '/explore' // ✅ Permitir acceso público a explorar
  ];
  
  if (publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }

  // Verificar autenticación - buscar token en cookies o headers
  const authToken = request.cookies.get('token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!authToken) {
    // Redirigir a login solo si no estamos ya en una ruta de auth
    if (!path.startsWith('/login') && !path.startsWith('/register')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 