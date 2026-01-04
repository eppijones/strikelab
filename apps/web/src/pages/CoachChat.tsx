import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatHistory, useSendChat } from '@/api/coach'
import { useSessions } from '@/api/sessions'
import { useAuthStore } from '@/stores/authStore'
import { Card, Button, Badge } from '@/components/ui'

// Suggested prompts for empty state
const SUGGESTED_PROMPTS = [
  { emoji: '🎯', text: 'How can I improve my strike quality?' },
  { emoji: '🔄', text: 'What drills should I do for face control?' },
  { emoji: '📊', text: 'Analyze my recent sessions' },
  { emoji: '🏌️', text: 'Help me fix my slice' },
  { emoji: '💪', text: 'Create a practice plan for this week' },
  { emoji: '🎓', text: 'Explain what smash factor means' },
]

export default function CoachChat() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [input, setInput] = useState('')
  const { data: messages, isLoading: messagesLoading } = useChatHistory()
  const { data: sessions } = useSessions({ limit: 5 })
  const sendChat = useSendChat()
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || sendChat.isPending) return
    
    setInput('')
    
    // Build context from recent sessions
    const context = sessions?.sessions?.slice(0, 3).map(s => ({
      session_id: s.id,
      name: s.name,
      date: s.session_date,
      shot_count: s.shot_count,
      stats: s.computed_stats,
    }))
    
    try {
      await sendChat.mutateAsync({
        content: messageText,
        context: { recent_sessions: context, handicap: user?.handicapIndex },
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan/20 to-emerald-500/20 flex items-center justify-center border border-cyan/30">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-ice-white flex items-center gap-2">
              AI Coach
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h1>
            <p className="text-sm text-muted">Your personal golf improvement assistant</p>
          </div>
        </div>
        
        {/* Quick Stats Context */}
        {user?.handicapIndex && (
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted">Current HCP</p>
              <p className="text-lg font-bold text-cyan">{user.handicapIndex}</p>
            </div>
            {user?.goalHandicap && (
              <div className="text-right">
                <p className="text-sm text-muted">Goal</p>
                <p className="text-lg font-bold text-emerald-400">{user.goalHandicap}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !messages || messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan/20 to-emerald-500/20 flex items-center justify-center border border-cyan/30 mb-6">
                <span className="text-4xl">💬</span>
              </div>
              <h2 className="text-xl font-display font-bold text-ice-white mb-2">
                Start a conversation
              </h2>
              <p className="text-muted max-w-md mb-8">
                Ask me anything about your game, get personalized drills, 
                analyze your data, or plan your practice sessions.
              </p>
              
              {/* Suggested Prompts */}
              <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt.text)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-cyan/30 hover:bg-cyan/5 transition-all text-left group"
                  >
                    <span className="text-xl">{prompt.emoji}</span>
                    <span className="text-sm text-muted group-hover:text-ice-white transition-colors">
                      {prompt.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-cyan text-obsidian rounded-br-sm'
                        : 'bg-graphite text-ice-white rounded-bl-sm border border-border'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                        <span className="text-sm">🤖</span>
                        <span className="text-xs font-medium text-cyan">AI Coach</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-obsidian/50' : 'text-muted'}`}>
                      {new Date(message.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {sendChat.isPending && (
                <div className="flex justify-start">
                  <div className="bg-graphite rounded-2xl rounded-bl-sm px-4 py-3 border border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🤖</span>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t border-border p-4 bg-graphite/50">
          {/* Context Chips */}
          {sessions?.sessions && sessions.sessions.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-xs text-muted whitespace-nowrap py-1">Context:</span>
              {sessions.sessions.slice(0, 3).map((session) => (
                <Badge key={session.id} variant="default" size="sm" className="whitespace-nowrap">
                  {session.name || session.source} • {session.shot_count} shots
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI coach anything..."
                rows={1}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-ice-white placeholder:text-muted focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 resize-none min-h-[48px] max-h-[120px]"
                style={{ height: 'auto' }}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sendChat.isPending}
              className="h-12 w-12 rounded-xl p-0 flex-shrink-0"
            >
              {sendChat.isPending ? (
                <div className="w-5 h-5 border-2 border-obsidian border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  )
}
