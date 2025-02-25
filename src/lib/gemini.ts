import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
export function getGeminiClient() {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('Google API key is not defined');
  }

  return new GoogleGenerativeAI(apiKey);
}

// Generate a response from Gemini
export async function generateResponse(prompt: string) {
  try {
    const enhancedPrompt = `${prompt}\n\nYou can format your response with markdown when appropriate.`;
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
}
