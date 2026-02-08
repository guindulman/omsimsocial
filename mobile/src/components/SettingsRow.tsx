import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { useTheme } from '../theme/useTheme';

type RightAccessory = 'switch' | 'chevron' | 'none';

type SettingsRowProps = {
  icon: IconName;
  title: string;
  description: string;
  rightAccessory?: RightAccessory;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export const SettingsRow = ({
  icon,
  title,
  description,
  rightAccessory = 'none',
  value,
  onValueChange,
  onPress,
  danger = false,
  disabled = false,
}: SettingsRowProps) => {
  const theme = useTheme();
  const palette = theme.isDark
    ? {
        cardTop: '#1B2540',
        cardBottom: '#121A2C',
        cardBorder: 'rgba(255, 255, 255, 0.08)',
        textPrimary: theme.colors.textPrimary,
        textSecondary: theme.colors.textSecondary,
        accent: theme.colors.accent,
        accentSoft: theme.colors.accentSoft,
        danger: theme.colors.urgency,
        dangerSoft: theme.colors.chipUrgency,
        switchOff: 'rgba(255, 255, 255, 0.18)',
      }
    : {
        cardTop: theme.colors.surface,
        cardBottom: theme.colors.surfaceAlt,
        cardBorder: theme.colors.borderSubtle,
        textPrimary: theme.colors.textPrimary,
        textSecondary: theme.colors.textSecondary,
        accent: theme.colors.accent,
        accentSoft: theme.colors.accentSoft,
        danger: theme.colors.urgency,
        dangerSoft: theme.colors.chipUrgency,
        switchOff: theme.colors.borderSubtle,
      };
  const isPressable = Boolean(onPress);
  const Wrapper: React.ElementType = isPressable ? Pressable : View;

  return (
    <Wrapper
      {...(isPressable
        ? {
            onPress: onPress,
            disabled: disabled,
            accessibilityRole: 'button',
            accessibilityLabel: title,
            hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
            style: ({ pressed }: { pressed: boolean }) => [
              styles.wrapper,
              { opacity: pressed ? 0.92 : 1 },
            ],
          }
        : { style: styles.wrapper })}
    >
      <LinearGradient
        colors={[palette.cardTop, palette.cardBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            borderColor: palette.cardBorder,
            shadowColor: theme.colors.shadow,
          },
        ]}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: danger ? palette.dangerSoft : palette.accentSoft,
                borderColor: danger ? palette.danger : palette.accent,
              },
            ]}
          >
            <Icon name={icon} size={18} color={danger ? palette.danger : palette.accent} />
          </View>

          <View style={styles.textBlock}>
            <AppText
              variant="subtitle"
              style={{ color: danger ? palette.danger : palette.textPrimary }}
            >
              {title}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: palette.textSecondary, marginTop: 2 }}
              numberOfLines={2}
            >
              {description}
            </AppText>
          </View>

          <View style={styles.accessory}>
            {rightAccessory === 'switch' ? (
              <Switch
                value={Boolean(value)}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ true: palette.accent, false: palette.switchOff }}
                thumbColor={Boolean(value) ? '#FFFFFF' : '#D0D5DD'}
                accessibilityLabel={title}
              />
            ) : null}
            {rightAccessory === 'chevron' ? (
              <Icon name="chevron-right" size={18} color={palette.textSecondary} />
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textBlock: {
    flex: 1,
    marginLeft: 12,
  },
  accessory: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
});
