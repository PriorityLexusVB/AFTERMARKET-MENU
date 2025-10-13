import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { PackageTier, AlaCarteOption } from '../types';

interface AIAssistantProps {
  packages: PackageTier[];
  alaCarteOptions: AlaCarteOption[];
}

type Message = {
  role: 'user' | 'model';
  text: string;
};

const AssistantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.84 2.84l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.84 2.84l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.84-2.84l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036a6 6 0 0 0 4.355 4.354l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258a6 6 0 0 0-4.355 4.354l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a6 6 0 0 0-4.355-4.354l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a6 6 0 0 0 4.355-4.354l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.558l.121.484a2.25 2.25 0 0 0 1.63 1.63l.484.121a.75.75 0 0 1 0 1.424l-.484.121a2.25 2.25 0 0 0-1.63 1.63l-.121.484a.75.75 0 0 1-1.424 0l-.121-.484a2.25 2.25 0 0 0-1.63-1.63l-.484-.121a.75.75 0 0 1 0-1.424l.484-.121a2.25 2.25 0 0 0 1.63-1.63l.121-.484A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M3.105 3.105a.75.75 0 0 1 .814-.156L18.42 8.75a.75.75 0 0 1 0 1.312L3.919 15.92a.75.75 0 0 1-1.042-.62V3.75c0-.309.158-.598.428-.765Z" />
    </svg>
);


const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

export const AIAssistant: React.FC<AIAssistantProps> = ({ packages, alaCarteOptions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const buildProductContext = useCallback(() => {
    let context = 'Here is the list of available products. Use this information exclusively to answer user questions.\n\n';

    context += '== Protection Packages ==\n';
    packages.forEach(pkg => {
        context += `- **${pkg.name} Package** (${formatPrice(pkg.price)}): Includes ${pkg.features.map(f => f.name).join(', ')}.\n`;
    });

    context += '\n== A La Carte & Add-On Options ==\n';
    alaCarteOptions.forEach(opt => {
        context += `- **${opt.name}** (${formatPrice(opt.price)}): ${opt.description}\n`;
    });

    return context;
  }, [packages, alaCarteOptions]);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setMessages([{ role: 'model', text: 'Hello! I am the Priority Lexus AI Assistant. How can I help you choose the perfect protection for your vehicle today?' }]);
    // Fix: Use process.env.API_KEY as required by the guidelines.
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      setError("The AI Assistant is not configured. Please add the API_KEY to the application's secrets.");
      return;
    }

    try {
      // Fix: Pass apiKey as a named parameter.
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are a friendly and knowledgeable sales assistant for Priority Lexus of Virginia Beach. Your goal is to help customers understand and choose the best vehicle protection products. You must only use the information provided below about the available packages and a la carte options. Do not invent products or prices. Be concise, helpful, and professional. If a user asks about something unrelated to Lexus vehicles or protection plans, politely steer the conversation back to the products. Do not use markdown for your responses.
      
${buildProductContext()}`;

      chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
      });
    } catch (e) {
        console.error("AI Initialization Error:", e);
        setError("There was an error initializing the AI Assistant.");
    }

  }, [isOpen, buildProductContext]);

  useEffect(() => {
    if(isOpen) {
        inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage.text });
      // Fix: Use response.text to get the model's reply directly.
      const modelMessage: Message = { role: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (e) {
      console.error("Gemini API Error:", e);
      const errorMessage: Message = { role: 'model', text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 sm:bottom-28 sm:right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-110 active:scale-100 z-40"
        aria-label="Open AI Assistant"
      >
        <AssistantIcon />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:justify-end sm:items-end p-0 sm:p-8" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full h-full sm:h-[70vh] sm:max-h-[600px] sm:w-[440px] flex flex-col transform transition-transform duration-300 ease-in-out translate-y-0 sm:translate-y-0 opacity-100 animate-slide-up-fast">
            <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <AssistantIcon />
                <h3 className="font-bold font-teko text-2xl tracking-wider">AI Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </header>
            
            <div className="flex-grow p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <div className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-end gap-2">
                    <div className="max-w-xs md:max-w-sm rounded-2xl px-4 py-2 bg-gray-700 rounded-bl-none">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}
                 {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-3 rounded-lg">{error}</div>
                 )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <footer className="p-4 border-t border-gray-700 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-gray-700 border-gray-600 rounded-full px-4 py-2 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={isLoading || !!error}
                />
                <button type="submit" disabled={isLoading || !input.trim() || !!error} className="bg-blue-600 text-white rounded-full p-2.5 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
                  <SendIcon />
                </button>
              </form>
            </footer>
          </div>
        </div>
      )}
       <style>{`
          @keyframes slide-up-fast {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @media (min-width: 640px) {
             @keyframes slide-up-fast {
              from { transform: translateY(20px) scale(0.98); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
          }
          .animate-slide-up-fast {
            animation: slide-up-fast 0.3s ease-out forwards;
          }
        `}</style>
    </>
  );
};
