import React, { useState, useCallback } from 'react';
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

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = useCallback((event, date) => {
    setShowDatePicker(false);
    if (date && event.type !== 'dismissed') {
      const formattedDate = date.toISOString().split('T')[0];
      onChangeText(formattedDate);
    }
  }, [onChangeText]);

  const handleOpenDatePicker = useCallback(() => {
    Keyboard.dismiss();
    setShowDatePicker(true);
  }, []);

  const handleNumberChange = useCallback((text) => {
    const numberValue = parseInt(text);
    if (!text) {
      onChangeText('');
      return;
    }
    if (numberValue >= 1 && numberValue <= 100) {
      onChangeText(text);
    } else {
      Alert.alert("Error", "El valor debe estar entre 1 y 100");
    }
  }, [onChangeText]);

  const getInputProps = () => {
    const baseProps = {
      style: [{ color }, styles.input],
      placeholderTextColor: color,
      autoCapitalize: "none",
    };

    switch (type) {
      case 'date':
        return {
          ...baseProps,
          value: value ? formatDate(value) : '',
          editable: false,
        };
      case 'number':
        return {
          ...baseProps,
          keyboardType: 'numeric',
          value,
          onChangeText: handleNumberChange,
        };
      case 'textarea':
        return {
          ...baseProps,
          style: [...baseProps.style, styles.textarea],
          multiline: true,
          value,
          onChangeText,
        };
      default:
        return {
          ...baseProps,
          value,
          onChangeText,
          secureTextEntry,
        };
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <View style={styles.inputContainer}>
        <TextInput
          {...getInputProps()}
          placeholder={placeholder}
        />
        {type === 'date' && (
          <TouchableOpacity onPress={handleOpenDatePicker} style={styles.dateButton}>
            <Ionicons name="calendar" size={24} color={color} />
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          locale="es-ES"
          minimumDate={new Date()}
          maximumDate={new Date(2025, 11, 31)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    padding: 10,
  },
});
