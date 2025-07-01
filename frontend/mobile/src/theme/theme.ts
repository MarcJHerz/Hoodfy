export const colors = {
  primary: '#f4511e',
  background: '#ffffff',
  text: '#000000',
  textLight: '#ffffff',
};

export const spacing = {
  small: 8,
  medium: 16,
  large: 24,
};

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.medium,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textLight,
    ...typography.button,
  },
}; 