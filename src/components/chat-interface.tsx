// src/components/chat-interface.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageItem } from '@/components/message-item';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Message {
  text: string;
  isUser: boolean;
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For typing animation
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(
    null
  );

  // Faster typing speeds (in milliseconds)
  const [typingSpeed] = useState({
    min: 1,
    max: 5,
    fastMin: 1,
    fastMax: 3,
    pauseMin: 10,
    pauseMax: 30,
  });

  // Track typing acceleration and bursts
  const [burstMode, setBurstMode] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Character grouping for realistic typing
  const characterGroupsRef = useRef<number>(1);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedText]);

  // Improved typing animation with natural bursts and pauses
  useEffect(() => {
    if (isTyping && currentMessageIndex !== null) {
      const fullText = messages[currentMessageIndex].text;

      if (displayedText.length < fullText.length) {
        // Clear any existing timeout
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }

        // Determine how many characters to type in this burst
        let charsToAdd = 1;

        // Randomly decide if we're going to type in burst mode
        if (Math.random() < 0.4 && !burstMode && displayedText.length > 5) {
          setBurstMode(true);
          characterGroupsRef.current = Math.floor(Math.random() * 3) + 2; // 2-4 chars at once
        } else if (burstMode && Math.random() < 0.3) {
          setBurstMode(false);
          characterGroupsRef.current = 1;
        }

        if (burstMode) {
          charsToAdd = characterGroupsRef.current;
        }

        // Make sure we don't go beyond text length
        charsToAdd = Math.min(
          charsToAdd,
          fullText.length - displayedText.length
        );

        // Next segment to add
        const nextSegment = fullText.substring(
          displayedText.length,
          displayedText.length + charsToAdd
        );

        // Determine delay based on characters and situation
        let delay;

        // Slow down for punctuation if it's the last character in our segment
        const lastChar = nextSegment[nextSegment.length - 1];
        if ('.!?'.includes(lastChar)) {
          delay = Math.floor(
            Math.random() * (typingSpeed.pauseMax - typingSpeed.pauseMin) +
              typingSpeed.pauseMin
          );
        } else if (',;:'.includes(lastChar)) {
          delay = Math.floor(
            (Math.random() * (typingSpeed.pauseMax - typingSpeed.pauseMin)) /
              2 +
              typingSpeed.pauseMin / 2
          );
        } else {
          delay = burstMode
            ? Math.floor(
                Math.random() * (typingSpeed.fastMax - typingSpeed.fastMin) +
                  typingSpeed.fastMin
              )
            : Math.floor(
                Math.random() * (typingSpeed.max - typingSpeed.min) +
                  typingSpeed.min
              );
        }

        // Set timeout for next character(s)
        typingTimerRef.current = setTimeout(() => {
          setDisplayedText((prev) => prev + nextSegment);
        }, delay);

        return () => {
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };
      } else {
        // Finished typing
        setIsTyping(false);
        setBurstMode(false);
        setCurrentMessageIndex(null);
      }
    }
  }, [
    isTyping,
    displayedText,
    currentMessageIndex,
    messages,
    typingSpeed,
    burstMode,
  ]);

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
      // Call the API to get JBot's response
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

      // For long responses, show content immediately with typing animation
      const responseText = data.response;

      // Add AI response to chat
      const newMessages = [
        ...messages,
        { text: userMessage, isUser: true },
        { text: responseText, isUser: false },
      ];
      setMessages(newMessages);

      // Start typing animation - show first chunk immediately for better UX
      setIsTyping(true);

      // For longer responses, show first 10 characters immediately
      const initialChunk =
        responseText.length > 10 ? responseText.substring(0, 10) : '';
      setDisplayedText(initialChunk);
      setCurrentMessageIndex(newMessages.length - 1); // +1 because we just added two messages
    } catch (error) {
      const err = error as Error;
      console.error('Error:', error);
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
            <div className="w-24 h-24 rounded-full bg-black/5 border border-gray-200 flex items-center justify-center">
              <span className="text-5xl font-bold text-black">J</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Welcome to JBot
              </h3>
              <p className="text-gray-500 mt-1">
                Your personal AI assistant. Ask me anything.
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
                isTyping={isTyping && index === currentMessageIndex}
                displayedText={
                  index === currentMessageIndex ? displayedText : ''
                }
              />
            ))}
            {isLoading && !isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3"
              >
                <Avatar>
                  <AvatarFallback className="bg-black text-white">
                    J
                  </AvatarFallback>
                </Avatar>
                <div className="bg-black rounded-lg py-2 px-3 rounded-tl-none text-white">
                  <div className="flex space-x-2 items-center h-6">
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border-gray-300 bg-white focus-visible:ring-black text-gray-900"
            disabled={isLoading || isTyping}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-black hover:bg-gray-800 text-white"
            disabled={isLoading || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
