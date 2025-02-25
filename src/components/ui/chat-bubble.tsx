import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
}

export function ChatBubble({ message, isUser }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'max-w-[80%] rounded-lg p-4 mb-4',
        isUser
          ? 'bg-primary text-primary-foreground ml-auto'
          : 'bg-muted self-start'
      )}
    >
      {message}
    </motion.div>
  );
}
