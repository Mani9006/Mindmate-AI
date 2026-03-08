import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';

interface TabBarIconProps {
  name: string;
  color: string;
  size: number;
  focused: boolean;
}

// Simple icon mapping using emoji/text
const iconMap: Record<string, string> = {
  home: '🏠',
  chatbubbles: '💬',
  compass: '🧭',
  person: '👤',
};

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, size, focused }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.icon,
          {
            fontSize: size,
            color,
            opacity: focused ? 1 : 0.7,
          },
        ]}
      >
        {iconMap[name] || '•'}
      </Text>
      {focused && (
        <View style={[styles.indicator, { backgroundColor: color }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
