// File: pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ResponseData = {
  response?: string;
  error?: string;
  details?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get API key directly from environment
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('API key is not defined');
      return res.status(500).json({
        error: 'API key is not configured',
        details: 'Make sure GOOGLE_API_KEY is set in your .env.local file',
      });
    }

    try {
      // Initialize the Gemini API client
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Generate content
      const result = await model.generateContent(message);
      const response = result.response;
      const textResponse = response.text();

      return res.status(200).json({ response: textResponse });
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);

      // Return detailed error information
      return res.status(500).json({
        error: 'Gemini API error',
        details: String(geminiError),
      });
    }
  } catch (error) {
    console.error('Error in chat API route:', error);
    return res.status(500).json({
      error: 'Failed to generate response',
      details: String(error),
    });
  }
}
