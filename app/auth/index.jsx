import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ButtonLink } from '@/components/ButtonLink';
import { InputField } from '@/components/InputField';
import { authUser } from '@/services/teacher';
import { useNavigation } from 'expo-router';
import { useAuth } from '@/services/AuthProvider';
export default function AuthLogin() {

  const navigation = useNavigation();
  const {setauthUser} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    try{

      var user = {
        email: email,
        password: password
      }

      const userData = await authUser(user)

      if (userData.success) {
        setauthUser(userData.user);
        Alert.alert(`Bienvenido ${userData.user.name}`, 'Las credenciales son correctas');
        navigation.navigate("(tabs)")
      }else{
        Alert.alert('Error', 'Email o contraseña incorrectos');
      }
    } catch(err) {
      Alert.alert('Error', 'Error al iniciar sesion intenete de nuevo');
    }
  };

  return (
    <ParallaxScrollView
      modo={1}
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/logo.webp')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.formContainer}>
        <InputField label='Email' value={email} onChangeText={setEmail} placeholder='Ej: ejemplo@gmial.com' />
        <InputField label='Contraseña' value={password} onChangeText={setPassword} placeholder='....' secureTextEntry />
        <ButtonLink text="LOGIN" modo='large' onPress={handleSubmit} color='primary'/>
      </ThemedView>
      
    </ParallaxScrollView>
  );
}


const styles = StyleSheet.create({
  formContainer: {
    flexDirection: 'column',
    padding: 16,
  },
  reactLogo: {
    height: '100%',
    width: '100%',
  },
});

