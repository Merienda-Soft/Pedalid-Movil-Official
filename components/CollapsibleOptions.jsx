import { useState } from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { BtnColors } from '../constants/BtnColors';
import { useBtnColor } from '../hooks/useBtnColor';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function CollapsibleOptions({ title, color, onPress }) {
  const btnColor = useBtnColor(color);
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';

  return (
    <TouchableOpacity
      style={[styles.heading]}
      onPress={onPress} // Uso de la prop onPress
      activeOpacity={0.8}>
      <ThemedText type="defaultSemiBold"><Ionicons name="book" size={14} color="#fff" />  {title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    paddingLeft: 20,
  },
});
