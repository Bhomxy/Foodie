import { getSupabase } from '@/lib/supabase';
import type { PantryItem } from '@/types/models';

type Row = {
  id: string;
  user_id: string;
  name: string;
  quantity: string | number;
  unit: string;
  expires_at: string | null;
  par_level: number | null;
  client_id: string | null;
  created_at: string;
};

function rowToItem(row: Row): PantryItem {
  return {
    id: row.client_id ?? row.id,
    name: row.name,
    quantity: Number(row.quantity),
    unit: row.unit,
    expiresAt: row.expires_at,
    parLevel: row.par_level != null ? Number(row.par_level) : null,
    createdAt: row.created_at,
  };
}

export async function pullPantryRemote(userId: string): Promise<{ items: PantryItem[]; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { items: [], error: 'No Supabase client' };

  const { data, error } = await sb
    .from('pantry_items')
    .select('id,user_id,name,quantity,unit,expires_at,par_level,client_id,created_at')
    .eq('user_id', userId);

  if (error) return { items: [], error: error.message };
  const rows = (data ?? []) as Row[];
  return { items: rows.map(rowToItem) };
}

/** Replace remote pantry with current list (simple MVP). */
export async function pushPantryRemote(userId: string, pantry: PantryItem[]): Promise<{ error?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: 'No Supabase client' };

  const { error: delErr } = await sb.from('pantry_items').delete().eq('user_id', userId);
  if (delErr) return { error: delErr.message };

  if (pantry.length === 0) return {};

  const insert = pantry.map((p) => ({
    user_id: userId,
    name: p.name,
    quantity: p.quantity,
    unit: p.unit,
    expires_at: p.expiresAt,
    par_level: p.parLevel,
    client_id: p.id,
  }));

  const { error: insErr } = await sb.from('pantry_items').insert(insert);
  if (insErr) return { error: insErr.message };
  return {};
}
