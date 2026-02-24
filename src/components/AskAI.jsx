import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, Sparkles, Lightbulb } from 'lucide-react'
import { askExpenses } from '../services/claudeService'
import SavingsSuggestions from './SavingsSuggestions'

const STARTER_QUESTIONS = [
  'How much did I spend this month?',
  "What's my biggest spending category?",
  'Am I spending too much on food?',
  'Give me a quick spending summary.',
]

export default function AskAI({ expenses }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = async (text) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed || isLoading) return

    const userMsg = { role: 'user', content: trimmed }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setIsLoading(true)

    try {
      const apiMessages = updated.map(m => ({ role: m.role, content: m.content }))
      const reply = await askExpenses(apiMessages, expenses)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Tips modal */}
      <SavingsSuggestions
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        expenses={expenses}
      />

      {/* Lightbulb button — above chat button */}
      <motion.button
        onClick={() => setShowTips(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-4 sm:right-6 z-50 w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full shadow-xl shadow-amber-500/30 flex items-center justify-center transition-colors duration-200"
        aria-label="Smart savings tips"
        title="Smart savings tips"
      >
        <Lightbulb className="w-6 h-6 text-white" />
      </motion.button>

      {/* Chat button */}
      <motion.button
        onClick={() => setIsOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-xl shadow-blue-500/30 flex items-center justify-center transition-colors duration-200"
        aria-label="Ask AI about expenses"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 md:w-96 glass-card flex flex-col overflow-hidden"
            style={{ height: '460px', maxHeight: 'calc(100vh - 130px)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold font-heading text-slate-700 dark:text-slate-200">Ask your expenses</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-body">Powered by Claude</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-body text-center py-1">
                    Ask anything about your spending
                  </p>
                  {STARTER_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-sm font-body text-slate-600 dark:text-slate-300 px-3 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm font-body leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl rounded-bl-sm px-3 py-2.5">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 dark:border-slate-700/50 p-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 focus-within:border-blue-500/50 px-3 py-2 transition-all duration-200">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Ask something..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-body disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="p-1 rounded-lg text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
