import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import AppShell from './AppShell';
import Providers from './providers';

const inter = Inter({ subsets: ["latin"] });

// Importar componentes como Client Components
const ServiceWorkerRegistration = dynamic(() => import("@/components/ServiceWorkerRegistration"), {
  ssr: false
});

const NotificationInitializer = dynamic(() => import("@/components/NotificationInitializer"), {
  ssr: false
});

export const metadata: Metadata = {
  title: "Hoodfy - Tu red social privada",
  description: "La red social privada para tu comunidad",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      </head>
      <body className={inter.className}>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
          <ServiceWorkerRegistration />
          <NotificationInitializer />
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
