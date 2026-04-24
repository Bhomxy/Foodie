import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Foodie</Text>
      <Text style={styles.body}>
        Weekday meal plans from your foodstuff, cooking steps, and reminders (including low-stock nudges). Connect
        Supabase and an Edge Function when you want GPT-driven recipes instead of local rules.
      </Text>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.85,
  },
});
