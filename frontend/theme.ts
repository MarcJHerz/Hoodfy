export const theme = {
  colors: {
    primary: '#2ECC71', // Verde brillante y moderno
    secondary: '#27AE60', // Verde más oscuro y elegante
    accent: '#00D2D3', // Cian brillante para contraste
    background: '#FFFFFF', // Blanco
    surface: '#F5F6FA', // Gris muy claro
    surfaceVariant: '#E8E9ED', // Agregado para variante de superficie
    text: '#2C3E50', // Azul oscuro casi negro
    textSecondary: '#7F8C8D', // Gris azulado
    error: '#E74C3C', // Rojo
    success: '#2ECC71', // Verde brillante
    warning: '#F1C40F', // Amarillo
    border: '#D6DBDF', // Gris claro
    card: '#FFFFFF', // Blanco
    notification: '#2ECC71', // Verde brillante
    lightText: '#7F8C8D', // Gris azulado
    darkText: '#2C3E50', // Azul oscuro casi negro
    highlight: '#00D2D3', // Cian brillante para resaltar
    shadow: '#2ECC71', // Verde brillante para sombras
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
    round: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      fontFamily: 'Inter-Bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      fontFamily: 'Inter-Regular',
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      fontFamily: 'Inter-Light',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter-SemiBold',
    },
  },
};

export const audioCardStyle = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
    marginTop: 10,
  },
}; 