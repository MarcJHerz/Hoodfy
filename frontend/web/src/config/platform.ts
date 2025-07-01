// Configuración específica para web
export const platform = {
  View: 'div',
  Text: 'span',
  TouchableOpacity: 'button',
  ScrollView: 'div',
  Image: 'img',
  Modal: 'div',
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Dimensions: {
    get: () => ({
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
    }),
  },
}; 