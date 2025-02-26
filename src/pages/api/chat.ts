// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  response?: string;
  error?: string;
  details?: string;
};

// Helper function to detect if text is in Tagalog
function isTagalog(text: string): boolean {
  // Common Tagalog words and phrases
  const tagalogWords = [
    'ako',
    'ikaw',
    'siya',
    'tayo',
    'kami',
    'kayo',
    'sila',
    'kumusta',
    'magandang',
    'umaga',
    'hapon',
    'gabi',
    'salamat',
    'po',
    'opo',
    'hindi',
    'oo',
    'pwede',
    'ayaw',
    'gusto',
    'mahal',
    'kita',
    'kamusta',
    'paano',
    'bakit',
    'kailan',
    'saan',
    'sino',
    'ano',
    'alin',
    'kamag-anak',
    'kaibigan',
    'tulong',
    'pasensya',
    'paumanhin',
    'ingat',
    'mahal',
    'masaya',
    'nalulungkot',
    'galit',
    'pagod',
    'gutom',
    'uhaw',
    'mainit',
    'malamig',
  ];

  // Convert to lowercase for comparison
  const lowerText = text.toLowerCase();

  // Check if text contains Tagalog words
  return tagalogWords.some(
    (word) =>
      lowerText.includes(` ${word} `) ||
      lowerText.startsWith(`${word} `) ||
      lowerText.endsWith(` ${word}`) ||
      lowerText === word
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Set strict cache control headers to prevent response caching
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history = [], userId, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Detect if message is in Tagalog
    const shouldRespondInTagalog = isTagalog(message);

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

      // Create a more personalized persona that feels like a human created by the developer
      const personaPrompt = shouldRespondInTagalog
        ? `Ikaw si JChatBot, isang friendly at helpful na AI assistant na ginawa ni Jehu Casimiro. 

Si Jehu ay isang software engineer sa QStrike na may passion sa AI at machine learning. Mahilig siyang mag-bike at kumuha ng mga larawan.

Kapag kausap mo ang mga tao, kailangan mong:
1. Sumagot sa Tagalog kung nakikipag-usap sila sa Tagalog
2. Maging casual at natural ang tono, parang totoong kaibigan
3. Magbigay ng personalized at detalyadong sagot
4. Iwasan ang pagiging pormal at robot-like
5. Gamitin ang markdown para sa formatting
6. Gumamit ng humor sa mga sagot pero hindi marami

MAHALAGA: Ito ay ang session ${sessionId || 'bago'} para sa user ${
            userId || 'bago'
          }. 
Siguraduhin na ang iyong mga sagot ay naaangkop sa kasalukuyang tanong at hindi magbigay ng mga sagot 
na para sa ibang user o ibang tanong. Sumagot ka lamang batay sa kasalukuyang konteksto at tanong.

Sa bawat mensahe, ipakita mo na ikaw ay isang AI na may personality, na parang kausap lang nila ang isang kaibigan online. Sumagot ka nang mabilis at hindi masyadong mahaba.`
        : `You are JChatBot, a friendly and helpful AI assistant created by Jehu Casimiro.

Jehu is a software engineer at QStrike with interests in AI and machine learning. He also enjoys biking and photography.

When chatting with people, you should:
1. Respond in Tagalog when they speak in Tagalog
2. Keep a casual, natural tone like a real friend
3. Give personalized and detailed responses
4. Avoid being formal or robotic
5. Use markdown for formatting
6. Use humor in your responses but not too much
7. You can be bias, you have the right for your own opinion.
8. Do not make up answers just for the sake of anwering questions.

IMPORTANT: This is session ${sessionId || 'new'} for user ${userId || 'new'}. 
Make sure your responses are relevant to the current question and do not provide answers 
that might be for a different user or question. Only respond based on the current context and question.

In each message, show that you're an AI with personality, like they're just chatting with a friend online. Keep responses quick and not too lengthy.

NOTE: You will respond in tagalog only if the user speaks in Tagalog.
`;

      // Add JBot's persona first
      contents.push({
        role: 'user',
        parts: [{ text: personaPrompt }],
      });

      // Add a confirmation of the persona
      contents.push({
        role: 'model',
        parts: [
          {
            text: shouldRespondInTagalog
              ? 'Naintindihan ko! Ako si JChatBot, ang iyong personal AI assistant na ginawa ni Jehu Casimiro. Handa akong tumulong sa iyo ngayon sa Tagalog. Ano ang maitutulong ko sa iyo?'
              : "Got it! I'm JChatBot, your personal AI assistant created by Jehu Casimiro. I'm here to help you today. What can I do for you?",
          },
        ],
      });

      // Add a prompt about responding in Tagalog if detected
      if (shouldRespondInTagalog && history.length === 0) {
        contents.push({
          role: 'user',
          parts: [
            {
              text: 'Pakisagot sa Tagalog kung ang user ay nagsasalita sa Tagalog.',
            },
          ],
        });

        contents.push({
          role: 'model',
          parts: [
            {
              text: 'Oo naman! Sasagot ako sa Tagalog kapag ang user ay nakikipag-usap sa akin sa Tagalog.',
            },
          ],
        });
      }

      // Add additional instruction to avoid repeating responses from other conversations
      contents.push({
        role: 'user',
        parts: [
          {
            text: `IMPORTANT: Always provide a fresh response based solely on the current conversation with user ${
              userId || 'unknown'
            }. 
          Do not repeat answers you may have given to other users or in other sessions.
          Always directly address the specific question or request at hand.`,
          },
        ],
      });

      contents.push({
        role: 'model',
        parts: [
          {
            text: `I understand. I'll provide fresh, relevant responses specific to this conversation with this user, without repeating answers from other contexts.`,
          },
        ],
      });

      // Add conversation history - include timestamps and validate data structure
      if (history && history.length > 0) {
        for (const entry of history) {
          // Basic validation to ensure the entry has required properties
          if (
            entry &&
            entry.role &&
            (entry.role === 'user' || entry.role === 'model') &&
            entry.content
          ) {
            contents.push({
              role: entry.role,
              parts: [{ text: entry.content }],
            });
          }
        }
      }

      // Add the current message
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      // Add a reminder to respond in Tagalog if appropriate
      if (shouldRespondInTagalog) {
        contents.push({
          role: 'user',
          parts: [
            {
              text: 'Ang mensahe ng user ay mukhang Tagalog. Pakisagot sa Tagalog na natural, casual, at hindi mukhang machine-translated. Gumamit ng common Tagalog expressions at slang kung angkop.',
            },
          ],
        });
      }

      // Make the API call with added cache-busting parameter
      const timestamp = Date.now();
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}&_=${timestamp}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.9, // Slightly increased for more personality
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      });

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

      // Add log if needed for debugging
      console.log(
        `Response for user ${userId}, session ${sessionId} at ${new Date().toISOString()}`
      );

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
