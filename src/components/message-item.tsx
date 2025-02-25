import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: string;
  isUser: boolean;
}

export function MessageItem({ message, isUser }: MessageItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-start mb-4 gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      <Avatar>
        {isUser ? (
          <AvatarFallback className="bg-zinc-200 text-zinc-700 border-2 border-zinc-300">
            YOU
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/gemini-avatar.png" alt="Gemini AI" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              AI
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div
        className={cn(
          'rounded-lg py-2 px-3 max-w-xs sm:max-w-md md:max-w-lg',
          isUser
            ? 'bg-zinc-100 text-zinc-800 rounded-tr-none border border-zinc-200'
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-zinc-800 rounded-tl-none border border-indigo-100'
        )}
      >
        {message}
      </div>
    </motion.div>
  );
}
