import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runClaudeWithTools } from '@/lib/claude';

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message manquant' }, { status: 400 });
  }

  // 1. Récupère le profil (une seule ligne en usage perso)
  const { data: profile } = await supabase.from('profile').select('*').single();

  // 2. Récupère les 20 derniers messages pour reconstruire le contexte
  //    (rappel : Claude n'a aucune mémoire entre deux appels API)
  const { data: history } = await supabase
    .from('conversation_messages')
    .select('role, content')
    .order('created_at', { ascending: true })
    .limit(20);

  // 3. Construit le tableau de messages attendu par l'API Claude
  const messages = (history ?? []).map((h) => ({
    role: h.role as 'user' | 'assistant',
    content: h.content
  }));
  messages.push({ role: 'user', content: message });

  // 4. Sauvegarde le message utilisateur avant l'appel (pour ne rien perdre en cas d'erreur)
  await supabase.from('conversation_messages').insert({
    role: 'user',
    content: message
  });

  // 5. Appelle Claude avec la boucle tool use
  const { finalText, toolLog } = await runClaudeWithTools(messages, profile);

  // 6. Sauvegarde la réponse finale
  await supabase.from('conversation_messages').insert({
    role: 'assistant',
    content: finalText
  });

  return NextResponse.json({ reply: finalText, toolLog });
}
