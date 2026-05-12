import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatHistory, useSendChat } from '@/api/coach'
import { useSessions } from '@/api/sessions'
import { Panel, SLLogo } from '@/components/ui'

const SUGGESTED = [
  'How can I improve my strike quality?',
  'What drills should I do for face control?',
  'Analyze my recent sessions',
  'Help me fix my slice',
  'Create a practice plan for this week',
  'Explain what smash factor means',
]

export default function CoachChat() {
  useTranslation()
  const { data: messages = [] } = useChatHistory()
  const { data: sessions } = useSessions({ limit: 5 })
  const send = useSendChat()
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function submit(text?: string) {
    const content = (text ?? input).trim()
    if (!content || send.isPending) return
    setInput('')
    const context = sessions?.sessions?.slice(0, 3).map((s) => ({
      id: s.id,
      name: s.name,
      session_date: s.session_date,
      computed_stats: s.computed_stats,
    }))
    await send.mutateAsync({ content, context: context ? { sessions: context } : undefined })
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">REPORTS › COACH CHAT</div>
        <h1 className="display text-[64px] m-0">
          AI <em>coach.</em>
        </h1>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <Panel id="CHAT" title="CONVERSATION" padded={false}>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <SLLogo size={32} />
                <div className="display text-[28px] mt-6">
                  Ask the <em>coach.</em>
                </div>
                <p className="text-body text-ink-2 mt-2">Numbers carry the argument.</p>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse text-right' : ''}`}
              >
                <div
                  className={`w-7 h-7 border ${
                    m.role === 'user'
                      ? 'border-line-strong text-ink-3'
                      : 'border-accent-fg text-accent-fg'
                  } flex items-center justify-center mono text-[10px]`}
                >
                  {m.role === 'user' ? 'YOU' : 'AI'}
                </div>
                <div
                  className={`flex-1 ${
                    m.role === 'assistant' ? 'serif text-[16px] text-ink' : 'text-[14px] text-ink-2'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="border-t border-line-strong p-3 flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Ask anything…"
              className="flex-1 bg-bg-2 border border-line-strong text-ink px-4 py-3 mono text-[13px] focus:border-accent-fg focus:outline-none"
            />
            <button
              onClick={() => submit()}
              disabled={send.isPending}
              className="bg-accent text-accent-ink px-5 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
            >
              Send →
            </button>
          </div>
        </Panel>

        <Panel id="HINTS" title="SUGGESTED">
          <div className="space-y-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="w-full text-left text-[13px] text-ink-2 hover:text-accent-fg border border-line-strong px-3 py-2 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
