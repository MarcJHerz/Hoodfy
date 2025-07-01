import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: object;
  textStyle?: object;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  style, 
  textStyle 
}) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress}
    >
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: colors.textLight,
    ...typography.button,
  },
}); 