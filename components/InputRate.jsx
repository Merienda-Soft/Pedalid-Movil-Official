import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export function InputRate({
  lightColor,
  darkColor,
  name,
  grade,
  onGradeChange          
}) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <View style={styles.container}>
      <Text style={[{ color }, styles.name]}>{name}</Text>
      <TextInput
        style={[{ color }, styles.input]}
        value={grade}
        keyboardType="numeric"
        placeholderTextColor={color} 
        onChangeText={onGradeChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',  // Espaciar entre nombre y input
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  name: {
    flex: 2,  // Ocupa más espacio para el nombre
    fontSize: 18,
  },
  input: {
    width: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    borderRadius: 4,
    textAlign: 'center', // Centrar el texto
  },
});
