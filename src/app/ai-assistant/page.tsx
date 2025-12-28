'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, MessageSquare, Plus, Trash2, Clock, Cross, Info, Zap } from 'lucide-react';
import { DashboardShell } from '@/components/layout';
import { Card, Button, useToast } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface UsageInfo {
  usage: number;
  limit: number | null;
  isFreeTier: boolean;
  rateLimit: {
    requests: number;
    interval: string;
  } | null;
}

const suggestedQuestions = [
  "What are some tips for better sleep?",
  "How can I improve my energy levels?",
  "What foods help with heart health?",
  "How much water should I drink daily?",
];

const RATE_LIMIT_KEY = 'ai_assistant_rate_limit_end';
const MIN_COOLDOWN = 65;

export default function AIAssistantPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Rate limit countdown
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  // Usage info
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [showUsageInfo, setShowUsageInfo] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchConversations();
    fetchUsage();
  }, []);

  // Fetch usage periodically
  useEffect(() => {
    const interval = setInterval(fetchUsage, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/ai/usage');
      if (res.ok) {
        const data = await res.json();
        setUsageInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const checkExistingRateLimit = useCallback(() => {
    try {
      const storedEndTime = localStorage.getItem(RATE_LIMIT_KEY);
      if (storedEndTime) {
        const endTime = parseInt(storedEndTime, 10);
        const now = Date.now();
        const remainingSeconds = Math.ceil((endTime - now) / 1000);
        
        if (remainingSeconds > 0) {
          startCountdownFromRemaining(remainingSeconds);
        } else {
          localStorage.removeItem(RATE_LIMIT_KEY);
        }
      }
    } catch (e) {
      console.error('Error checking rate limit:', e);
    }
  }, []);

  useEffect(() => {
    checkExistingRateLimit();
  }, [checkExistingRateLimit]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const startCountdownFromRemaining = (seconds: number) => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    setRateLimitCountdown(seconds);
    
    countdownRef.current = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          try {
            localStorage.removeItem(RATE_LIMIT_KEY);
          } catch (e) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCountdown = (seconds: number) => {
    const actualSeconds = Math.max(seconds, MIN_COOLDOWN);
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    const endTime = Date.now() + (actualSeconds * 1000);
    try {
      localStorage.setItem(RATE_LIMIT_KEY, endTime.toString());
    } catch (e) {}
    
    setRateLimitCountdown(actualSeconds);
    
    countdownRef.current = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          try {
            localStorage.removeItem(RATE_LIMIT_KEY);
          } catch (e) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/ai/conversations');
      const data = await res.json();
      if (data.data) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const loadConversation = async (convId: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/ai/messages?conversationId=${convId}`);
      const data = await res.json();
      if (data.data) {
        setMessages(data.data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })));
        setConversationId(convId);
        setShowHistory(false);
        showToast('success', 'Conversation loaded');
      }
    } catch (error) {
      showToast('error', 'Failed to load conversation');
    }
    setIsLoadingHistory(false);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai/conversations?id=${convId}`, { method: 'DELETE' });
      setConversations(conversations.filter(c => c.id !== convId));
      if (conversationId === convId) {
        startNewChat();
      }
      showToast('success', 'Conversation deleted');
    } catch (error) {
      showToast('error', 'Failed to delete conversation');
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
    showToast('info', 'Started new conversation');
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    if (rateLimitCountdown > 0) {
      showToast('info', `Please wait ${formatCountdown(rateLimitCountdown)} before sending`);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('Sending message to AI:', text.trim());
      
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationId,
        }),
      });

      console.log('AI Response status:', res.status);
      
      const data = await res.json();
      console.log('AI Response data:', data);

      // Refresh usage after each message
      fetchUsage();

      if (data.isRateLimit || res.status === 429) {
        const retryAfter = data.retryAfter || MIN_COOLDOWN;
        startCountdown(retryAfter);
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I need a short break to recharge! Please wait about ${Math.ceil(retryAfter / 60)} minute(s) and I'll be ready to help you again. 💙`,
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Accept both 'message' and 'response' from API
      const aiContent = data.message || data.response;
      
      if (!aiContent) {
        console.error('No AI content in response:', data);
        throw new Error('No response from AI');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        fetchConversations();
      }
    } catch (error: any) {
      console.error('AI Chat error:', error);
      
      const errorMsg = error?.message || '';
      if (errorMsg.includes('429') || errorMsg.includes('rate')) {
        startCountdown(MIN_COOLDOWN);
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again in a moment. 💙",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatUsage = (credits: number) => {
    if (credits < 0.01) return '<$0.01';
    return `$${credits.toFixed(2)}`;
  };

  return (
    <DashboardShell>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"
        >
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <Cross className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              Faith
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 mt-1">Your AI Health Companion</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Usage Indicator */}
            <div className="relative">
              <button
                onClick={() => setShowUsageInfo(!showUsageInfo)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  usageInfo?.isFreeTier 
                    ? "bg-green-50 text-green-600 hover:bg-green-100" 
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                )}
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {usageInfo?.isFreeTier ? 'Free Tier' : formatUsage(usageInfo?.usage || 0)}
                </span>
                <Info className="w-3 h-3 opacity-60" />
              </button>

              {/* Usage Info Popover */}
              <AnimatePresence>
                {showUsageInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#131C2E] rounded-xl shadow-lg border border-gray-200 dark:border-[#293548] p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">AI Usage</h3>
                      <button 
                        onClick={() => setShowUsageInfo(false)}
                        className="text-gray-400 hover:text-gray-600 dark:text-slate-300"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Tier Badge */}
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          usageInfo?.isFreeTier 
                            ? "bg-green-100 text-green-700" 
                            : "bg-blue-100 text-blue-700"
                        )}>
                          {usageInfo?.isFreeTier ? '🆓 Free Tier' : '💎 Paid'}
                        </span>
                      </div>

                      {/* Usage Stats */}
                      {usageInfo && (
                        <>
                          <div className="bg-gray-50 dark:bg-[#1A2742] rounded-lg p-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-slate-300">Credits Used</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatUsage(usageInfo.usage)}
                              </span>
                            </div>
                            {usageInfo.limit && (
                              <>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-600 dark:text-slate-300">Limit</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {formatUsage(usageInfo.limit)}
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary-500 rounded-full transition-all"
                                    style={{ 
                                      width: `${Math.min((usageInfo.usage / usageInfo.limit) * 100, 100)}%` 
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {usageInfo.rateLimit && (
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                              <span className="font-medium">Rate Limit:</span>{' '}
                              {usageInfo.rateLimit.requests} requests / {usageInfo.rateLimit.interval}
                            </div>
                          )}
                        </>
                      )}

                      {/* Free Tier Info */}
                      {usageInfo?.isFreeTier && (
                        <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg p-2">
                          <p className="font-medium text-yellow-700 mb-1">Free Tier Limits:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-yellow-600">
                            <li>Limited requests per minute</li>
                            <li>Shared model capacity</li>
                            <li>Response times may vary</li>
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 text-center">
                        Powered by OpenRouter
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rate Limit Indicator */}
            <AnimatePresence>
              {rateLimitCountdown > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                  title="Faith is recharging"
                >
                  <Clock className="w-4 h-4" />
                  <span className="tabular-nums">{formatCountdown(rateLimitCountdown)}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowHistory(!showHistory)}
              className={showHistory ? 'bg-gray-100 dark:bg-slate-700' : ''}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button variant="outline" size="sm" onClick={startNewChat}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </div>
        </motion.div>

        <div className="flex-1 flex gap-4 min-h-0 relative">
          {/* Conversation History Sidebar - Hidden on mobile */}
          <AnimatePresence>
            {showHistory && (
              <>
                {/* Mobile overlay */}
                <div 
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setShowHistory(false)}
                />
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="fixed left-0 top-0 h-full w-72 z-50 lg:relative lg:z-auto lg:w-72 flex-shrink-0"
                >
                <Card className="h-full p-4 overflow-y-auto">
                  <h3 className="font-semibold text-gray-700 dark:text-slate-200 mb-3">Past Conversations</h3>
                  {isLoadingHistory && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    </div>
                  )}
                  {conversations.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-slate-400">No conversations yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start chatting to save history</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={cn(
                            'p-3 rounded-xl cursor-pointer group transition-colors',
                            conversationId === conv.id
                              ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                              : 'hover:bg-gray-50 dark:hover:bg-[#1A2742] border border-transparent'
                          )}
                          onClick={() => loadConversation(conv.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 flex-1">
                              {conv.title}
                            </p>
                            <button
                              onClick={(e) => deleteConversation(conv.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all text-gray-400 dark:text-slate-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                            {formatDate(conv.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Cross className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Hi, I&apos;m Faith! 👋
                  </h3>
                  <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-md">
                    I&apos;m your personal health companion. Ask me anything about health, 
                    nutrition, fitness, or wellness. I&apos;m here to support your health journey!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                    {suggestedQuestions.map((question) => (
                      <button
                        key={question}
                        onClick={() => handleSend(question)}
                        disabled={rateLimitCountdown > 0}
                        className={cn(
                          "p-3 text-left text-sm bg-gray-50 dark:bg-[#1A2742] rounded-xl transition-colors border border-gray-100 dark:border-[#293548] text-gray-700 dark:text-slate-300",
                          rateLimitCountdown > 0 
                            ? "opacity-50 cursor-not-allowed" 
                            : "hover:bg-gray-100 dark:hover:bg-[#293548] hover:border-gray-200 dark:hover:border-[#3B4A63]"
                        )}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Cross className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-3',
                          message.role === 'user'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-[#1A2742] text-gray-900 dark:text-white'
                        )}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-[#1A2742] rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                        <Cross className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-slate-400" />
                          <span className="text-sm text-gray-500 dark:text-slate-400">Faith is thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3 sm:p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={rateLimitCountdown > 0 ? `Recharging (${formatCountdown(rateLimitCountdown)})...` : "Ask Faith anything..."}
                  className={cn(
                    "flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base",
                    rateLimitCountdown > 0 && "bg-gray-50 text-gray-400 dark:text-slate-500"
                  )}
                  disabled={isLoading || rateLimitCountdown > 0}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading || rateLimitCountdown > 0}
                  className="px-3 sm:px-4"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center hidden sm:block">
                Faith provides health information only. Always consult a healthcare professional for medical advice.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}