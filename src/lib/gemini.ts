import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateRandomTopic(apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Generate a single, highly engaging, and intellectually stimulating topic suitable for a philosophical or scientific discussion. It should be a specific concept or intersection of ideas that can be explained educationally. 
  
  Examples: 
  - The philosophical implications of artificial gravity
  - The role of epigenetics in behavioral evolution
  - Ethical frameworks for autonomous decision-making in medical AI
  - The concept of time as an illusion in physics
  
  Return ONLY the topic string, no quotes, no extra text.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}
