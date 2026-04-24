import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { ensureUserProfile } from '@/lib/ensureProfile';
import { getSupabase } from '@/lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const { signIn, signUp } = useAuth();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const border = colorScheme === 'dark' ? '#333' : '#ddd';
  const fg = colorScheme === 'dark' ? '#fff' : '#000';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setMessage(null);
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error } = await signIn(email, password);
        if (error) setMessage(error);
        else {
          const sb = getSupabase();
          const { data } = await sb?.auth.getSession() ?? { data: { session: null } };
          if (data.session?.user?.id) {
            await ensureUserProfile(data.session.user.id, email);
          }
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) setMessage(error);
        else {
          setMessage('Check your email to confirm, or sign in if already verified.');
          const { getSupabase } = await import('@/lib/supabase');
          const sb = getSupabase();
          const u = sb?.auth.getUser();
          const uid = (await u)?.data.user?.id;
          if (uid) await ensureUserProfile(uid, email);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.title}>Foodie</Text>
        <Text style={styles.sub}>Sign in to sync foodstuff across devices (Supabase).</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: border, color: fg }]}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { borderColor: border, color: fg }]}
        />

        <Pressable
          onPress={onSubmit}
          disabled={busy}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: tint, opacity: busy ? 0.6 : pressed ? 0.9 : 1 },
          ]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{mode === 'in' ? 'Sign in' : 'Create account'}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'in' ? 'up' : 'in')} style={styles.switch}>
          <Text style={{ color: tint }}>
            {mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </Text>
        </Pressable>

        {message ? <Text style={styles.msg}>{message}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 15, opacity: 0.75, marginBottom: 24, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  switch: { marginTop: 20, alignItems: 'center' },
  msg: { marginTop: 16, fontSize: 14, lineHeight: 20, opacity: 0.85 },
});
