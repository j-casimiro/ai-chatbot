// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';

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
    const { message, history = [] } = req.body;

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
      // Construct the API request with conversation history
      const contents = [];

      // Add JBot's persona first
      contents.push({
        role: 'user',
        parts: [
          {
            text: 'You are JChatBot, a helpful and friendly AI assistant. Respond in markdown, use casual language, and avoid bullet points when possible.',
          },
        ],
      });

      contents.push({
        role: 'model',
        parts: [
          {
            text: "I understand! I'm JChatBot, your personal AI assistant. I'll keep my responses conversational and helpful, I am also going to respond straightforward.",
          },
        ],
      });

      // Add conversation history
      if (history && history.length > 0) {
        for (const entry of history) {
          contents.push({
            role: entry.role === 'user' ? 'user' : 'model',
            parts: [{ text: entry.content }],
          });
        }
      }

      // Add the current message
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      // Make the API call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API response error: ${response.status} ${
            response.statusText
          }\n${JSON.stringify(errorData, null, 2)}`
        );
      }

      const data = await response.json();

      // Extract the text from the response
      let responseText = '';
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content;
        if (content.parts && content.parts.length > 0) {
          responseText = content.parts
            .map((part: { text: string }) => part.text)
            .join('');
        }
      }

      return res.status(200).json({ response: responseText });
    } catch (error) {
      const err = error as Error;
      console.error('Gemini API error:', error);

      // Return detailed error information
      return res.status(500).json({
        error: 'Gemini API error',
        details: err.message || String(error),
      });
    }
  } catch (error) {
    const err = error as Error;
    console.error('Error in chat API route:', error);
    return res.status(500).json({
      error: 'Failed to generate response',
      details: err.message || String(error),
    });
  }
}
