// Supabase Edge Function — OpenAI JSON meal plan for Foodie.
// Secrets: OPENAI_API_KEY (required), optional OPENAI_MODEL (default gpt-4o-mini)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MODEL = 'gpt-4o-mini';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not set in Edge Function secrets' }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { pantry, dates } = await req.json();
    const datesList: string[] = Array.isArray(dates) ? dates : [];

    const pantrySummary = Array.isArray(pantry)
      ? pantry.map((p: { name?: string; quantity?: number; unit?: string }) =>
          `${p.name ?? '?'}: ${p.quantity ?? 0} ${p.unit ?? ''}`.trim(),
        ).join('; ')
      : '';

    const system = `You are a meal planning assistant. Return ONLY valid JSON (no markdown) with this shape:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "slot": "breakfast" | "lunch" | "dinner",
          "rationale": "short string why this fits their pantry",
          "recipe": {
            "id": "ai-" + lowercase slug from title + "-" + random 4 chars,
            "title": "string",
            "mealType": "breakfast" | "lunch" | "dinner",
            "description": "one sentence",
            "ingredientsUsed": ["ingredient1", "ingredient2"],
            "estimatedMinutes": number,
            "steps": [
              { "order": 1, "title": "short", "detail": "what to do", "durationMinutes": optional number }
            ]
          }
        }
      ]
    }
  ]
}
Rules:
- Provide exactly one breakfast, lunch, and dinner per date in dates.
- Use only dates from the provided list, in order.
- Recipes should use ingredients the user likely has; suggest simple substitutions in rationale if needed.
- ids must be unique across all recipes in the response.`;

    const userMsg = `Dates (YYYY-MM-DD): ${datesList.join(', ')}\nPantry: ${pantrySummary || 'empty'}`;

    const model = Deno.env.get('OPENAI_MODEL') ?? DEFAULT_MODEL;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `OpenAI error ${res.status}`, detail: t }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const completion = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      return new Response(JSON.stringify({ error: 'Empty AI response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = JSON.parse(raw) as { days?: unknown[] };
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
