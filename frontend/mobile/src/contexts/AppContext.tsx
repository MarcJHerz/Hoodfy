import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { registerForPushNotificationsAsync } from '../config/notifications.config';

interface AppContextType {
  user: any;
  loading: boolean;
  notificationToken: string | null;
}

const AppContext = createContext<AppContextType>({
  user: null,
  loading: true,
  notificationToken: null,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);

  useEffect(() => {
    // Configurar el listener de autenticación
    const unsubscribeAuth = auth().onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Registrar para notificaciones push
    const setupNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      setNotificationToken(token?.data);
    };

    setupNotifications();

    return () => {
      unsubscribeAuth();
    };
  }, []);

  return (
    <AppContext.Provider value={{ user, loading, notificationToken }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext); 