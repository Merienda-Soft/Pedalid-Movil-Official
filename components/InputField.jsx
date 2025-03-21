import React from 'react';
import { TextInput, StyleSheet, View, TextInputProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';

export function InputField({ 
  lightColor, 
  darkColor, 
  label, 
  value, 
  onChangeText, 
  secureTextEntry, 
  placeholder = '',
  error,
  ...props 
}) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const backgroundColor = useThemeColor({ light: '#f5f5f5', dark: '#2a2a2a' }, 'background');

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.label}>{label}</ThemedText>
      <View style={[
        styles.inputContainer,
        error && styles.inputError,
        { backgroundColor }
      ]}>
        <TextInput
          style={[
            { color },
            styles.input,
            error && styles.inputTextError
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={color + '80'}
          autoCapitalize="none"
          {...props}
        />
      </View>
      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff3b30',
    backgroundColor: '#fff5f5',
  },
  inputTextError: {
    color: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
});
