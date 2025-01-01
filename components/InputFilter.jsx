import React, { useState } from 'react';
import { TextInput, StyleSheet, View, TouchableOpacity, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';  // Usando Ionicons para el ícono de búsqueda
import DateTimePicker from '@react-native-community/datetimepicker';  // Para el selector de fecha
import { useThemeColor } from '@/hooks/useThemeColor';

export function InputFilter({
  lightColor,
  darkColor,
  value,
  onChangeText,
  onPress,
  type = 'search',
  placeholder = '',
}) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);  // Almacena la fecha seleccionada

  // Función que maneja el cambio de fecha en el date picker
  const handleDateChange = (event, date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];  // Convertir la fecha a YYYY-MM-DD
      setSelectedDate(formattedDate);  // Actualizar la fecha en el estado
      onChangeText(formattedDate);  // Notificar el cambio al padre
    }
    setShowDatePicker(false);  // Ocultamos el DateTimePicker
  };

  // Función para abrir el DateTimePicker
  const handleOpenDatePicker = () => {
    if (Platform.OS === 'android') {
      Keyboard.dismiss();  // Cerrar el teclado en Android
    }
    setShowDatePicker(true);  // Mostrar el DateTimePicker
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[{ color }, styles.input]}
        value={selectedDate || value}  // Mostramos la fecha seleccionada o el valor del input
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color} 
        keyboardType={type === 'number' ? 'numeric' : 'default'}
        editable={type !== 'date'}  // Si es de tipo fecha, no permitir edición manual
      />

      {/* Botón de calendario solo si es de tipo "date" */}
      {type === 'date' && (
        <TouchableOpacity onPress={handleOpenDatePicker} style={styles.dateButton}>
          <Ionicons name="calendar-number" size={24} color={color} />
        </TouchableOpacity>
      )}
      
      {/* Botón de búsqueda */}
      <TouchableOpacity onPress={onPress} style={styles.searchButton}>
        <Ionicons name="search" size={24} color={color} />
      </TouchableOpacity>

      {/* Mostrar el DateTimePicker solo si es necesario */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}  // Fecha predeterminada
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}  // Inline en iOS, Default en Android
          onChange={handleDateChange}  // Manejar la fecha seleccionada
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',  // Alinear los elementos en fila
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,  // El input toma todo el espacio disponible
    paddingVertical: 8,
    paddingRight: 10,  // Dejar espacio para el botón de búsqueda
  },
  dateButton: {
    paddingHorizontal: 8,  // Espacio para el botón de calendario
  },
  searchButton: {
    paddingHorizontal: 8,  // Espacio para el botón de búsqueda
  },
});
