import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Colors } from '../constants/Colors';

import { BtnColors } from '../constants/BtnColors';
import { useBtnColor } from '../hooks/useBtnColor';

export function Collapsible({ children, title, color }) {
  const btnColor = useBtnColor(color);

  const [isOpen, setIsOpen] = useState(true);
  const theme = useColorScheme() ?? 'light';

  return (
    <ThemedView>
      <TouchableOpacity
        style={[{backgroundColor: btnColor, borderBottomRightRadius: isOpen ? 0 : 8}, styles.heading]}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <Ionicons
          name={isOpen ? 'chevron-down-circle' : 'chevron-forward-circle'}
          size={18}
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
        />
        <ThemedText type="subtitle">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && (
        <ThemedView
          style={[
            { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: btnColor },
            styles.content,
          ]}>
          {children}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 20,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  content: {
    marginLeft: 24,
  },
});
