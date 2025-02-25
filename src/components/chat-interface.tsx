// Updated ChatInterface.tsx with better error handling
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageItem } from '@/components/message-item';
import { Send, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Message {
  text: string;
  isUser: boolean;
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null); // Clear previous errors

    // Add user message to chat
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);

    // Show loading state
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add AI response to chat
      setMessages((prev) => [...prev, { text: data.response, isUser: false }]);
    } catch (error) {
      const err = error as { message: string };
      console.error('Error:', err);
      setError(err.message || 'An unexpected error occurred');
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I couldn't process that request. Please check the error message below.",
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full space-y-4 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-zinc-200 flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
                  fill="#6366F1"
                  opacity="0.5"
                />
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  fill="#6366F1"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-800">
                Welcome to Gemini AI
              </h3>
              <p className="text-zinc-500 mt-1">
                Ask me anything to start our conversation
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageItem
                key={index}
                message={message.text}
                isUser={message.isUser}
              />
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3"
              >
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg py-2 px-3 rounded-tl-none border border-indigo-100">
                  <div className="flex space-x-2 items-center h-6">
                    <div
                      className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 p-4 bg-zinc-50">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border-zinc-300 bg-white focus-visible:ring-indigo-500 text-zinc-800"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            disabled={isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
