import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet, View, TouchableOpacity, Platform, Keyboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export function InputType({
  lightColor,
  darkColor,
  label,
  value,
  onChangeText,
  type = 'text',
  secureTextEntry,
  placeholder = ''
}) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value);

  useEffect(() => {
    setSelectedDate(value);  // Asegura que el componente siempre use el valor más reciente
  }, [value]);

  const handleDateChange = (event, date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
      onChangeText(formattedDate);
    }
    setShowDatePicker(false);
  };

  const handleOpenDatePicker = () => {
    if (Platform.OS === 'android') {
      Keyboard.dismiss();
    }
    setShowDatePicker(true);
  };

  const handleNumberChange = (text) => {
    const numberValue = parseInt(text);
    if (numberValue >= 1 && numberValue <= 100) {
      onChangeText(text);
    } else {
      Alert.alert("Valor no permitido", "El número debe estar entre 1 y 100.");
    }
  };

  const isMultiline = type === 'textarea';
  const keyboardType = type === 'number' ? 'numeric' : 'default';

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>

      <View style={styles.inputContainer}>
        <TextInput
          style={[{ color }, styles.input, isMultiline && styles.textarea]}
          value={type === 'date' ? selectedDate : value}
          onChangeText={type === 'number' ? handleNumberChange : onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          placeholder={placeholder}
          placeholderTextColor={color}
          keyboardType={keyboardType}
          editable={type !== 'date'}
          multiline={isMultiline}
        />

        {type === 'date' && (
          <TouchableOpacity onPress={handleOpenDatePicker} style={styles.dateButton}>
            <Ionicons name="calendar" size={24} color={color} />
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate ? new Date(selectedDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    paddingHorizontal: 8,
  },
});
