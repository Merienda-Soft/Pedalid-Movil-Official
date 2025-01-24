import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import { BtnColors } from '../constants/BtnColors';
import { useBtnColor } from '../hooks/useBtnColor';

export function ButtonLink({ style, text, modo, screenName, color, onPress }) {
  const btnColor = useBtnColor(color);
  const navigation = useNavigation();
  
  // Combinamos los estilos
  const combinedStyle = StyleSheet.flatten([styles.button, getButtonStyle(modo), { backgroundColor: btnColor }, style]);
  
  // Función para manejar el evento onPress
  const handlePress = () => {
    if (onPress) {
      onPress();  // Ejecuta onPress si está definido
    } else if (screenName) {
      navigation.navigate(screenName);  // Navega si se proporciona un screenName
    } else {
      console.log('No onPress or screenName defined');
    }
  };
  
  return (
    <TouchableOpacity style={combinedStyle} onPress={handlePress}>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

// Función para obtener el estilo según el modo
const getButtonStyle = (modo) => {
  switch (modo) {
    case 'small':
      return { width: '40%' };  // Botón pequeño
    case 'medium':
      return { width: '70%', alignSelf: 'center' };  // Botón mediano centrado
    case 'large':
      return { width: '100%', alignSelf: 'center' };  // Botón grande
    default:
      return { width: 'auto' };
  }
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
