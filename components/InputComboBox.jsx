import React from 'react';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export function InputComboBox({
  lightColor,
  darkColor,
  label,
  selectedValue,
  onValueChange,
  options,
}) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue) => {
            onValueChange(itemValue);
          }}
          style={[{ color }, styles.picker]}
        >
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.text} value={option.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  pickerContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
  },
  picker: {
    height: 50,
    width: '100%',
  },
});
