import { motion, AnimatePresence } from 'framer-motion'
import { CardGlass } from './CardGlass'
import { Button } from './Button'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AICoachOverlayProps {
  isOpen: boolean
  onClose: () => void
  context?: string
}

export function AICoachOverlay({ isOpen, onClose, context }: AICoachOverlayProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = context 
        ? `Looking at your ${context} stats? I've noticed a pattern in your last session.`
        : "How can I help you improve your game today?"
      
      setMessages([{ role: 'assistant', content: greeting }])
    }
  }, [isOpen, context])

  const handleSend = () => {
    if (!inputValue.trim()) return
    const newMessages = [...messages, { role: 'user', content: inputValue }]
    setMessages(newMessages)
    setInputValue('')
    
    // Simple mock response
    setTimeout(() => {
      setMessages([...newMessages, { role: 'assistant', content: "I'm analyzing that for you. Based on your strike pattern, focusing on your tempo might yield the quickest results." }])
    }, 1000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-nordic-forest/20 backdrop-blur-md z-[100]"
          />
          
          {/* Half-sheet Overlay */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[101] flex justify-center p-4"
          >
            <CardGlass className="w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl overflow-hidden" padding="none">
              {/* Header */}
              <div className="p-6 border-b border-nordic-forest/10 dark:border-white/10 flex justify-between items-center bg-white/40 dark:bg-nordic-forest/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-nordic-forest dark:bg-nordic-sage flex items-center justify-center">
                    <svg className="w-5 h-5 text-nordic-sage dark:text-nordic-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-nordic-forest dark:text-white tracking-tight">AI Coach</h2>
                    <p className="text-[10px] font-bold text-nordic-sage uppercase tracking-widest">Always There</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-nordic-forest/5 dark:hover:bg-white/5 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-nordic-forest/40 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex",
                      m.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                      m.role === 'user' 
                        ? "bg-nordic-forest dark:bg-nordic-sage text-white dark:text-nordic-forest rounded-tr-none" 
                        : "bg-white/80 dark:bg-nordic-forest/60 text-nordic-forest dark:text-white border border-nordic-forest/5 dark:border-white/5 rounded-tl-none"
                    )}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white/40 dark:bg-nordic-forest/40 border-t border-nordic-forest/10 dark:border-white/10">
                <div className="relative">
                  <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your technique, drills, or stats..."
                    className="w-full bg-white/80 dark:bg-nordic-forest/60 border border-nordic-forest/10 dark:border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-nordic-forest/20 dark:focus:ring-white/20 transition-all text-nordic-forest dark:text-white placeholder:text-nordic-forest/30 dark:placeholder:text-white/30"
                  />
                  <button 
                    onClick={handleSend}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-nordic-forest dark:bg-nordic-sage text-white dark:text-nordic-forest rounded-xl hover:bg-nordic-forest/90 dark:hover:bg-nordic-sage/90 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </CardGlass>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
