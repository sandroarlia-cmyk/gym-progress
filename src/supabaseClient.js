import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Variabili Supabase mancanti. Crea un file .env con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vedi .env.example)."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");

const ROW_ID = "singleton";

export async function loadGymData() {
  const { data, error } = await supabase
    .from("gym_data")
    .select("*")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error) {
    console.error("Errore nel caricamento dati:", error.message);
    return null;
  }
  return data;
}

export async function saveField(field, value) {
  const payload = { id: ROW_ID, [field]: value, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("gym_data").upsert(payload);
  if (error) console.error(`Errore nel salvataggio di ${field}:`, error.message);
}
