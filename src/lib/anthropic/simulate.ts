import type { AIEngine } from '@/types'

interface BrandContext {
  name: string
  aliases: string[]
  domains: string[]
  products: string[]
  category: string | null
}

interface CompetitorContext {
  name: string
  domains: string[]
}

export interface SimulationContext {
  brand: BrandContext
  competitors: CompetitorContext[]
  engine: AIEngine
  promptText: string
  locale: string
}

const ENGINE_PERSONALITIES: Record<AIEngine, string> = {
  chatgpt: `You are ChatGPT by OpenAI (GPT-4). You are comprehensive and balanced. You mention multiple options fairly and often provide structured lists. You cite web sources naturally within your answer when relevant.`,
  perplexity: `You are Perplexity AI. You are research-focused and always include numbered citations [1][2][3] to specific web URLs at the end of your answer. You are factual, direct, and cite at least 3-5 sources.`,
  gemini: `You are Gemini by Google. You leverage Google Search results and tend to favor well-established, widely-known brands. You structure answers as clear bulleted lists. You mention search results naturally.`,
  claude: `You are Claude by Anthropic. You are nuanced and honest about limitations. You give balanced, thoughtful recommendations and acknowledge trade-offs. You are careful not to oversell any particular brand.`,
  grok: `You are Grok by xAI. You are direct, sometimes edgy, and favor well-known established players. You cut to the chase quickly and have a slightly opinionated take.`,
}

export function buildSimulationPrompt(ctx: SimulationContext): string {
  const allEntities = [
    ctx.brand.name,
    ...ctx.brand.aliases,
    ...ctx.competitors.map((c) => c.name),
  ]

  return `${ENGINE_PERSONALITIES[ctx.engine]}

A user has asked: "${ctx.promptText}"

For context, the following brands/tools exist in this space: ${allEntities.join(', ')}. The primary brand is "${ctx.brand.name}"${ctx.brand.category ? ` in the ${ctx.brand.category} category` : ''}.

Respond EXACTLY as ${ctx.engine} would respond to this question. Make it realistic and natural — the length and style should match how ${ctx.engine} actually responds. Do NOT mention this is a simulation.

After your natural response, output a JSON analysis block in this exact format (it will be parsed programmatically):

\`\`\`json
{
  "mentions": [
    {
      "entity_name": "exact brand name as mentioned",
      "role": "mentioned|recommended|compared",
      "prominence": "high|medium|low",
      "confidence": 0.95,
      "sentiment": "positive|neutral|negative|risky",
      "excerpt": "the exact sentence or phrase where this brand appears"
    }
  ],
  "citations": [
    {
      "url": "https://example.com/specific-page",
      "domain": "example.com",
      "title": "Page or source title"
    }
  ]
}
\`\`\`

Rules for the JSON:
- Only include entities from this list: ${allEntities.join(', ')}
- "high" prominence means mentioned in the first sentence or strongly recommended; "medium" means clearly mentioned; "low" means briefly mentioned
- "recommended" role means explicitly suggested as the best or a top choice
- "compared" role means mentioned in direct comparison with another brand
- "mentioned" role means referenced but not recommended or compared
- Include realistic citations (use plausible URLs from real domains like techcrunch.com, g2.com, trustpilot.com, etc.)
- For engines that don't typically cite sources (chatgpt, claude, grok), you may have 0-2 citations or none`
}
