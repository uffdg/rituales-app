import { supabase } from "./supabase";
import type { DailyAnchorType, DailyAnchorStepContent } from "./daily-anchor";

/**
 * Guarda un paso de ancla diaria en Supabase.
 * Requiere que exista la tabla `daily_anchor_entries`:
 *
 * create table daily_anchor_entries (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users(id) on delete cascade not null,
 *   date_key text not null,
 *   step text not null check (step in ('inicio', 'momento', 'cierre')),
 *   text_content text,
 *   feeling text,
 *   alignment text,
 *   created_at timestamptz default now(),
 *   unique(user_id, date_key, step)
 * );
 * alter table daily_anchor_entries enable row level security;
 * create policy "Users manage own anchor entries"
 *   on daily_anchor_entries for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 */
export async function saveDailyAnchorEntry(params: {
  userId: string;
  dateKey: string;
  step: DailyAnchorType;
  content: DailyAnchorStepContent;
}): Promise<void> {
  const { userId, dateKey, step, content } = params;
  await supabase.from("daily_anchor_entries").upsert(
    {
      user_id: userId,
      date_key: dateKey,
      step,
      text_content: content.text ?? null,
      feeling: content.feeling ?? null,
      alignment: content.alignment ?? null,
    },
    { onConflict: "user_id,date_key,step" },
  );
  // Errors are silently ignored — localStorage is the source of truth on the client
}
