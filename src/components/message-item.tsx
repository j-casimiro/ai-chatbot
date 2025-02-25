import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

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
        {isUser ? (
          message
        ) : (
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                // Fix: Remove 'node' from destructuring to avoid ESLint warnings
                h1: ({ ...props }) => (
                  <h1 className="text-xl font-bold my-2" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-lg font-bold my-2" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-md font-bold my-1" {...props} />
                ),
                h4: ({ ...props }) => (
                  <h4 className="font-bold my-1" {...props} />
                ),
                p: ({ ...props }) => <p className="my-1" {...props} />,
                ul: ({ ...props }) => (
                  <ul className="list-disc pl-5 my-1" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal pl-5 my-1" {...props} />
                ),
                li: ({ ...props }) => <li className="my-0.5" {...props} />,
                a: ({ ...props }) => (
                  <a className="text-blue-600 hover:underline" {...props} />
                ),
                strong: ({ ...props }) => (
                  <strong className="font-bold" {...props} />
                ),
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="border-l-4 border-zinc-300 pl-2 my-2 italic"
                    {...props}
                  />
                ),
                code: ({ ...props }) => (
                  <code
                    className="bg-zinc-200 px-1 rounded text-sm"
                    {...props}
                  />
                ),
                pre: ({ ...props }) => (
                  <pre
                    className="bg-zinc-200 p-2 rounded my-2 overflow-x-auto text-sm"
                    {...props}
                  />
                ),
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
