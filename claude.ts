import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// --- Définition des tools que Claude peut "demander" à utiliser ---
// Claude ne les exécute jamais lui-même : il renvoie une intention,
// et c'est notre code (executeTool) qui agit réellement sur la DB.
const tools: Anthropic.Tool[] = [
  {
    name: 'log_routine_entry',
    description:
      "Enregistre un produit utilisé dans la routine skincare/haircare du jour. À utiliser dès que l'utilisateur mentionne avoir appliqué ou utilisé un produit.",
    input_schema: {
      type: 'object',
      properties: {
        product_name: { type: 'string', description: 'Nom du produit utilisé' },
        time_of_day: { type: 'string', enum: ['matin', 'soir'] },
        category: {
          type: 'string',
          description: 'ex: nettoyant, sérum, crème, shampoing, après-shampoing'
        },
        notes: { type: 'string', description: 'Remarques optionnelles' }
      },
      required: ['product_name', 'time_of_day']
    }
  },
  {
    name: 'get_routine_history',
    description:
      "Récupère l'historique récent de routine, utile pour répondre à des questions sur ce qui a été utilisé récemment ou pour évaluer une évolution.",
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Nombre de jours à récupérer, défaut 7' }
      }
    }
  }
];

function buildSystemPrompt(profile: any) {
  return `Tu es l'assistant personnel skincare et haircare de l'utilisateur.

Profil actuel :
- Type de peau : ${profile?.skin_type ?? 'non renseigné'}
- Type de cheveux : ${profile?.hair_type ?? 'non renseigné'}
- Allergies / sensibilités : ${profile?.allergies?.length ? profile.allergies.join(', ') : 'aucune renseignée'}
- Objectifs : ${profile?.goals?.length ? profile.goals.join(', ') : 'non renseignés'}

Règles :
- Reste dans le conseil cosmétique général (ingrédients, routines, bonnes pratiques).
- Pour tout ce qui ressemble à un problème médical (acné sévère, réaction allergique, douleur, perte de cheveux soudaine et importante), recommande de consulter un dermatologue plutôt que de poser un diagnostic.
- Utilise les tools disponibles pour enregistrer ou consulter la routine quand c'est pertinent, plutôt que de simplement répondre en texte.
- Sois concis et concret, évite le blabla marketing.`;
}

async function executeTool(name: string, input: any) {
  if (name === 'log_routine_entry') {
    const { error } = await supabase.from('routine_entries').insert({
      product_name: input.product_name,
      time_of_day: input.time_of_day,
      category: input.category ?? null,
      notes: input.notes ?? null
    });
    if (error) return { error: error.message };
    return { success: true };
  }

  if (name === 'get_routine_history') {
    const days = input.days ?? 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('routine_entries')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    if (error) return { error: error.message };
    return { entries: data };
  }

  return { error: `Tool inconnu: ${name}` };
}

// Boucle principale : envoie les messages à Claude, exécute les tools demandés,
// relance jusqu'à obtenir une réponse texte finale (ou 5 itérations max, garde-fou).
export async function runClaudeWithTools(messages: Anthropic.MessageParam[], profile: any) {
  const system = buildSystemPrompt(profile);
  const toolLog: any[] = [];
  let currentMessages = [...messages];

  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages: currentMessages,
      tools
    });

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    if (toolUseBlocks.length === 0) {
      const textBlock = response.content.find(
        (b): b is Anthropic.TextBlock => b.type === 'text'
      );
      return { finalText: textBlock?.text ?? '', toolLog };
    }

    // On ajoute la réponse de Claude (contenant les tool_use) à l'historique
    currentMessages.push({ role: 'assistant', content: response.content });

    // On exécute chaque tool demandé et on prépare les tool_results
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const result = await executeTool(block.name, block.input);
      toolLog.push({ tool: block.name, input: block.input, result });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result)
      });
    }

    currentMessages.push({ role: 'user', content: toolResults });
  }

  return { finalText: "Désolé, je n'ai pas réussi à finaliser la réponse.", toolLog };
}
