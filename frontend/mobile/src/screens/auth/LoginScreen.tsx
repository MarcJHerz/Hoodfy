import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Button } from '../../components/Button';
import { signInWithEmail, signInWithGoogle } from '../../config/auth.config';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../../../theme';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../MainNavigator';
import axios from 'axios';
import { API_URL } from '../../config/constants';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));

  // Validación de email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Animación de shake para errores
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      setError('Error al iniciar sesión con Google');
      shake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    // Validaciones
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña');
      shake();
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      shake();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      // 2. Obtener el token de Firebase
      const token = await user.getIdToken();

      // 3. Registrar/actualizar usuario en el backend
      try {
        await axios.post(`${API_URL}/auth/register`, {
          email: user.email,
          firebaseUid: user.uid,
          name: user.displayName || email.split('@')[0],
          username: email.split('@')[0],
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error: any) {
        // Si el usuario ya existe, no es un error
        if (error.response?.status !== 409) {
          console.error('Error al registrar usuario en el backend:', error);
        }
      }

    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Correo o contraseña incorrectos');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos fallidos. Por favor, intenta más tarde');
          break;
        case 'auth/network-request-failed':
          setError('Error de conexión. Verifica tu conexión a internet');
          break;
        default:
          setError('Error al iniciar sesión');
      }
      shake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View 
          style={[
            styles.content,
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          <Text style={styles.title}>Bienvenido a Qahood</Text>
          <Text style={styles.subtitle}>
            Conecta con tu comunidad y comparte tus experiencias
          </Text>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Correo electrónico"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Contraseña"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry
              editable={!isLoading}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <TouchableOpacity 
              style={[styles.emailButton, isLoading && styles.buttonDisabled]}
              onPress={handleEmailSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.emailButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                ¿No tienes cuenta? Regístrate
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Image 
              source={require('../../../assets/google-icon.png')} 
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>
              Continuar con Google
            </Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            Al continuar, aceptas nuestros{' '}
            <Text style={styles.termsLink}>Términos y Condiciones</Text>
            {' '}y{' '}
            <Text style={styles.termsLink}>Política de Privacidad</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  emailButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  registerButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  registerButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  terms: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  termsLink: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
}); 