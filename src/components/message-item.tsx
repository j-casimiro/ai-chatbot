// src/components/message-item.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface MessageItemProps {
  message: string;
  isUser: boolean;
  isTyping?: boolean;
  displayedText?: string;
}

export function MessageItem({
  message,
  isUser,
  isTyping = false,
  displayedText = '',
}: MessageItemProps) {
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
          <AvatarFallback className="bg-gray-200 text-gray-800 border-2 border-gray-300">
            YOU
          </AvatarFallback>
        ) : (
          <>
            <AvatarFallback className="bg-black text-white">J</AvatarFallback>
          </>
        )}
      </Avatar>

      <div
        className={cn(
          'rounded-lg py-2 px-3 max-w-xs sm:max-w-md md:max-w-lg',
          isUser
            ? 'bg-gray-100 text-gray-900 rounded-tr-none border border-gray-200'
            : 'bg-black text-white rounded-tl-none'
        )}
      >
        {isUser ? (
          message
        ) : (
          <div className="markdown-content">
            {isTyping ? (
              <>
                <ReactMarkdown
                  components={{
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
                      <a className="text-blue-300 hover:underline" {...props} />
                    ),
                    strong: ({ ...props }) => (
                      <strong className="font-bold" {...props} />
                    ),
                    blockquote: ({ ...props }) => (
                      <blockquote
                        className="border-l-4 border-gray-500 pl-2 my-2 italic"
                        {...props}
                      />
                    ),
                    code: ({ ...props }) => (
                      <code
                        className="bg-gray-800 px-1 rounded text-sm"
                        {...props}
                      />
                    ),
                    pre: ({ ...props }) => (
                      <pre
                        className="bg-gray-800 p-2 rounded my-2 overflow-x-auto text-sm"
                        {...props}
                      />
                    ),
                  }}
                >
                  {displayedText}
                </ReactMarkdown>
                <span className="inline-block w-1 h-4 bg-white animate-pulse ml-0.5"></span>
              </>
            ) : (
              <ReactMarkdown
                components={{
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
                    <a className="text-blue-300 hover:underline" {...props} />
                  ),
                  strong: ({ ...props }) => (
                    <strong className="font-bold" {...props} />
                  ),
                  blockquote: ({ ...props }) => (
                    <blockquote
                      className="border-l-4 border-gray-500 pl-2 my-2 italic"
                      {...props}
                    />
                  ),
                  code: ({ ...props }) => (
                    <code
                      className="bg-gray-800 px-1 rounded text-sm"
                      {...props}
                    />
                  ),
                  pre: ({ ...props }) => (
                    <pre
                      className="bg-gray-800 p-2 rounded my-2 overflow-x-auto text-sm"
                      {...props}
                    />
                  ),
                }}
              >
                {message}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
