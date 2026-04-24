import { getSupabase } from '@/lib/supabase';

export async function ensureUserProfile(userId: string, emailHint?: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const display = emailHint?.split('@')[0] ?? 'Foodie user';
  await sb.from('profiles').upsert({ id: userId, display_name: display }, { onConflict: 'id' });
}
