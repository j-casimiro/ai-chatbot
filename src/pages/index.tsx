import type { NextPage } from 'next';
import Head from 'next/head';
import { ChatInterface } from '@/components/chat-interface';
import { Card, CardContent } from '@/components/ui/card';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Head>
        <title>Gemini AI Chatbot</title>
        <meta name="description" content="Chat with Gemini AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container py-10 mx-auto">
        <Card className="max-w-3xl mx-auto border border-zinc-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="white" />
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  fill="#6366F1"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">
              Gemini AI Assistant
            </h1>
          </div>
          <CardContent className="p-0">
            <ChatInterface />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Home;
