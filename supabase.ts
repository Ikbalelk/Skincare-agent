import { createClient } from '@supabase/supabase-js';

// Utilise la service_role key : ce client ne tourne QUE côté serveur
// (dans app/api/*), jamais exposé au navigateur.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
