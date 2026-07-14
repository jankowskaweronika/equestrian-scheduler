import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { canOperateLessons } from '@equestrian-scheduler/domain';
import { colors, spacing, typography } from '@equestrian-scheduler/ui-tokens';

export default function App() {
  const canUseLessonTools = canOperateLessons('instructor');

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Equestrian Scheduler</Text>
      <Text style={styles.title}>Aplikacja mobilna</Text>
      <Text style={styles.body}>
        Szkielet Expo jest gotowy. Kolejny krok to logowanie, własne jazdy i widok wolnych terminów.
      </Text>
      <Text style={styles.meta}>Lesson tools enabled: {canUseLessonTools ? 'yes' : 'no'}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  body: {
    color: colors.text,
    fontSize: typography.fontSize.md,
    lineHeight: 24,
    maxWidth: 320,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
});
