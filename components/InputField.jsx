import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export function InputField({ lightColor, darkColor, label, value, onChangeText, secureTextEntry, placeholder = '' }) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <TextInput
        style={[{ color }, styles.input]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={color} 
        autoCapitalize="none"
        keyboardType={label === 'Email' ? 'email-address' : 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
