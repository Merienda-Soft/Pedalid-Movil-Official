import { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { InputField } from '../../components/InputField';
import { authUser } from '../../services/teacher';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../services/AuthProvider';
import { Ionicons } from '@expo/vector-icons';

export default function AuthLogin() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const { setauthUser } = useAuth();
  
  // Estados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Colores dinámicos basados en el tema
  const colors = useMemo(() => ({
    background: colorScheme === 'dark' ? '#1D3D47' : '#f5f5f5',
    cardBackground: colorScheme === 'dark' ? '#2A4A54' : '#ffffff',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    secondaryText: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
    primary: colorScheme === 'dark' ? '#4DA6FF' : '#17A2B8',
    border: colorScheme === 'dark' ? '#3A5A64' : '#E0E0E0',
    shadow: colorScheme === 'dark' ? '#000000' : '#000000',
    error: '#FF6B6B',
    icon: colorScheme === 'dark' ? '#B0B0B0' : '#666666',
  }), [colorScheme]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingrese su email');
      return false;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor ingrese un email válido');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Por favor ingrese su contraseña');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const user = {
        email: email.trim(),
        password: password
      };

      const userData = await authUser(user);

      if (userData.success) {
        setauthUser(userData.user);
        navigation.navigate("(tabs)");
      } else {
        Alert.alert('Error', 'Email o contraseña incorrectos');
      }
    } catch (err) {
      Alert.alert('Error', 'Error al iniciar sesión. Por favor intente de nuevo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ThemedView style={[styles.mainContainer, { backgroundColor: colors.background }]}>
        <View style={[
          styles.formContainer, 
          { 
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
          }
        ]}>
          <ThemedText 
            type="title" 
            style={[styles.title, { color: colors.primary }]}
          >
            Bienvenido
          </ThemedText>
          <ThemedText 
            style={[styles.subtitle, { color: colors.secondaryText }]}
          >
            Inicia sesión para continuar
          </ThemedText>
          
          <View style={styles.inputContainer}>
            <InputField 
              label='Email' 
              value={email} 
              onChangeText={setEmail} 
              placeholder='Ej: ejemplo@gmail.com'
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.secondaryText}
              style={{ color: colors.text }}
            />
            <View style={styles.passwordContainer}>
              <InputField 
                label='Contraseña' 
                value={password} 
                onChangeText={setPassword} 
                placeholder='••••••••' 
                secureTextEntry={!showPassword}
                placeholderTextColor={colors.secondaryText}
                style={{ color: colors.text }}
              />
              <Pressable 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color={colors.icon}
                />
              </Pressable>
            </View>
          </View>

          <Pressable 
            style={[
              styles.loginButton, 
              { backgroundColor: colors.primary },
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.loginButtonText}>
                Iniciar Sesión
              </ThemedText>
            )}
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    flexDirection: 'column',
    padding: 24,
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
    gap: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 45,
    padding: 4,
  },
  loginButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

