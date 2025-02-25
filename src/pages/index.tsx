import type { NextPage } from 'next';
import Head from 'next/head';
import { ChatInterface } from '@/components/chat-interface';
import { Card, CardContent } from '@/components/ui/card';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>JChatBot - Your Personal AI Assistant</title>
        <meta
          name="description"
          content="Chat with JChatBot, your personal AI assistant"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container py-10 mx-auto">
        <Card className="max-w-3xl mx-auto border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-black p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <h1 className="text-xl font-semibold text-white">JChatBot</h1>
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
