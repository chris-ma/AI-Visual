import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai'

let model: GenerativeModel | null = null

export function getAIClient(): GenerativeModel {
  if (!model) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }
  return model
}
