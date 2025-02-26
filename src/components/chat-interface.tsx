import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageItem } from '@/components/message-item';
import { Send, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';

// You can use uuid if installed, or this simpler function
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

interface ConversationEntry {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

// Safe localStorage wrapper
const storage = {
  getItem: (key: string, defaultValue: any = null): any => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  setItem: (key: string, value: any): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },
};

export function ChatInterface() {
  // User ID state - initialized properly for SSR
  const [userId, setUserId] = useState<string>('');

  // Initialize userId safely only on client-side
  useEffect(() => {
    const storedUserId = storage.getItem('jbot-user-id', '');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = generateUUID();
      storage.setItem('jbot-user-id', newUserId);
      setUserId(newUserId);
    }
  }, []);

  // Create storage keys specific to this user - we'll set these after userId is available
  const [storageKeys, setStorageKeys] = useState({
    messagesKey: '',
    historyKey: '',
    sessionKey: '',
  });

  // Update storage keys when userId is set
  useEffect(() => {
    if (userId) {
      setStorageKeys({
        messagesKey: `jbot-messages-${userId}`,
        historyKey: `jbot-history-${userId}`,
        sessionKey: `jbot-session-${userId}`,
      });
    }
  }, [userId]);

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

  // For conversation history
  const [conversationHistory, setConversationHistory] = useState<
    ConversationEntry[]
  >([]);

  // Session tracking
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  const shouldUpdateStorage = useRef(true);

  // Typing animation refs
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const characterGroupsRef = useRef<number>(1);
  const [burstMode, setBurstMode] = useState(false);

  // Typing speed configuration
  const [typingSpeed] = useState({
    min: 1,
    max: 5,
    fastMin: 1,
    fastMax: 3,
    pauseMin: 10,
    pauseMax: 30,
  });

  // Generate unique IDs for messages
  const generateId = useCallback(() => {
    return `${userId}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
  }, [userId]);

  // Load conversation from localStorage - with user isolation
  // We only do this once userId and storage keys are available
  useEffect(() => {
    if (!userId || !storageKeys.messagesKey) return;

    try {
      const savedSessionId = storage.getItem(storageKeys.sessionKey, '');

      // Only load if this is a new session or browser refresh
      if (savedSessionId !== sessionIdRef.current) {
        const savedMessages = storage.getItem(storageKeys.messagesKey, []);
        const savedHistory = storage.getItem(storageKeys.historyKey, []);

        if (savedMessages && savedMessages.length > 0) {
          // Verify the messages belong to this user and add IDs if missing
          const validMessages = savedMessages
            .filter((msg: any) => {
              // Only accept messages for this user or without a user ID (legacy)
              const msgUserId = msg.id?.split('-')[0];
              return !msgUserId || msgUserId === userId;
            })
            .map((msg: any) => ({
              ...msg,
              id: msg.id || generateId(),
              timestamp: msg.timestamp || Date.now(),
            }));

          setMessages(validMessages);
        }

        if (savedHistory && savedHistory.length > 0) {
          // Similar validation for history entries
          const validHistory = savedHistory
            .filter((entry: any) => {
              const entryUserId = entry.id?.split('-')[0];
              return !entryUserId || entryUserId === userId;
            })
            .map((entry: any) => ({
              ...entry,
              id: entry.id || generateId(),
              timestamp: entry.timestamp || Date.now(),
            }));

          setConversationHistory(validHistory);
        }

        // Save the current session ID
        storage.setItem(storageKeys.sessionKey, sessionIdRef.current);
      }
    } catch (err) {
      console.error('Error loading conversation history:', err);
      // If there's an error loading, start fresh for this user
      storage.removeItem(storageKeys.messagesKey);
      storage.removeItem(storageKeys.historyKey);
      storage.removeItem(storageKeys.sessionKey);
    }

    // Prevent immediate localStorage updates right after loading
    shouldUpdateStorage.current = false;
    setTimeout(() => {
      shouldUpdateStorage.current = true;
    }, 500);
  }, [userId, storageKeys, generateId]);

  // Debounced save to localStorage with user isolation
  const saveToLocalStorage = useCallback(
    (messages: Message[], history: ConversationEntry[]) => {
      if (!shouldUpdateStorage.current || !userId || !storageKeys.messagesKey)
        return;

      try {
        if (messages.length > 0) {
          storage.setItem(storageKeys.messagesKey, messages);
        }

        if (history.length > 0) {
          storage.setItem(storageKeys.historyKey, history);
        }
      } catch (err) {
        console.error('Error saving conversation history:', err);
      }
    },
    [userId, storageKeys]
  );

  // Debounced localStorage updates
  const debouncedSaveRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return; // Don't save if userId is not yet initialized

    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }

    debouncedSaveRef.current = setTimeout(() => {
      saveToLocalStorage(messages, conversationHistory);
    }, 300);

    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, [messages, conversationHistory, saveToLocalStorage, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedText]);

  // Typing animation logic
  useEffect(() => {
    if (isTyping && currentMessageIndex !== null) {
      const message = messages.find(
        (_, index) => index === currentMessageIndex
      );
      if (!message) return;

      const fullText = message.text;

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

    if (!input.trim() || isLoading || !userId) return;

    const userMessage = input.trim();
    setInput('');
    setError(null); // Clear previous errors

    const messageId = generateId();
    const timestamp = Date.now();

    // Add user message to chat and history
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        text: userMessage,
        isUser: true,
        timestamp,
      },
    ]);

    setConversationHistory((prev) => [
      ...prev,
      {
        id: messageId,
        role: 'user',
        content: userMessage,
        timestamp,
      },
    ]);

    // Show loading state
    setIsLoading(true);

    try {
      // Add conversation-specific information to help with context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add cache control to prevent cached responses
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: JSON.stringify({
          message: userMessage,
          // Include unique user ID to help prevent cross-talk
          userId: userId,
          // Include session ID for tracking
          sessionId: sessionIdRef.current,
          // Send more context to help with response relevance
          history: conversationHistory.slice(-15), // Increased context window
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Get the response text
      const responseText = data.response;
      const responseId = generateId();
      const responseTimestamp = Date.now();

      // Add AI response to messages state
      setMessages((prev) => [
        ...prev,
        {
          id: responseId,
          text: responseText,
          isUser: false,
          timestamp: responseTimestamp,
        },
      ]);

      // Add AI response to conversation history
      setConversationHistory((prev) => [
        ...prev,
        {
          id: responseId,
          role: 'model',
          content: responseText,
          timestamp: responseTimestamp,
        },
      ]);

      // Start typing animation
      setIsTyping(true);

      // For longer responses, show first 10 characters immediately
      const initialChunk =
        responseText.length > 10 ? responseText.substring(0, 10) : '';
      setDisplayedText(initialChunk);
      setCurrentMessageIndex(messages.length + 1); // Point to the newly added response
    } catch (error) {
      const err = error as Error;
      console.error('Error:', error);
      setError(err.message || 'An unexpected error occurred');
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          text: "Sorry, I couldn't process that request. Please check the error message below.",
          isUser: false,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
    // Only clear this user's data
    if (userId && storageKeys.messagesKey) {
      storage.removeItem(storageKeys.messagesKey);
      storage.removeItem(storageKeys.historyKey);
    }
  };

  return (
    <div className="flex flex-col h-[600px] relative">
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
              <Image
                src="/jbot-avatar.svg"
                alt="JBot"
                width={100}
                height={100}
              />
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
                key={message.id}
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

      {/* Sticky circular clear button */}
      {messages.length > 0 && (
        <div className="absolute bottom-20 left-2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={clearConversation}
            className="h-8 w-8 rounded-full bg-white shadow-md hover:bg-red-300 transition-colors"
            title="Clear Conversation"
          >
            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
          </Button>
        </div>
      )}

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border-gray-300 bg-white focus-visible:ring-black text-gray-900"
            disabled={isLoading || isTyping || !userId}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-black hover:bg-gray-800 text-white"
            disabled={isLoading || isTyping || !userId}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
