import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Loader2, Camera, CalendarDays, ChevronDown } from 'lucide-react'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isToday(date) {
  return date === todayISO()
}

function formatShort(date) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const PLACEHOLDER_EXAMPLES = [
  'Spent 250 on lunch at Swiggy...',
  'Paid 15000 for rent...',
  'Netflix subscription 649...',
  'Ola to airport 450 rupees...',
  'Chai for 30 at Chaayos...',
  'Groceries at DMart 1200...',
  'Doctor visit 500...',
  'New shoes at Myntra 2499...',
]

function useTypewriter(texts, speed = 60, pause = 2000) {
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    if (isTyping) {
      if (charIndex < texts[textIndex].length) {
        const timeout = setTimeout(() => {
          setDisplayText(texts[textIndex].slice(0, charIndex + 1))
          setCharIndex(c => c + 1)
        }, speed)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => setIsTyping(false), pause)
        return () => clearTimeout(timeout)
      }
    } else {
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(texts[textIndex].slice(0, charIndex - 1))
          setCharIndex(c => c - 1)
        }, speed / 2)
        return () => clearTimeout(timeout)
      } else {
        setTextIndex(i => (i + 1) % texts.length)
        setIsTyping(true)
      }
    }
  }, [charIndex, isTyping, textIndex, texts, speed, pause])

  return displayText
}

export default function MagicInput({ onSubmit, disabled, onScanReceipt }) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const placeholder = useTypewriter(PLACEHOLDER_EXAMPLES)

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || isParsing || disabled) return

    setIsParsing(true)
    try {
      await onSubmit(trimmed, selectedDate)
      setValue('')
      setSelectedDate(todayISO())
    } finally {
      setIsParsing(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCameraClick = () => {
    if (isScanning || isParsing || disabled) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !onScanReceipt) return

    // Reset so same file can be picked again
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      // dataUrl = "data:image/jpeg;base64,..."
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type || 'image/jpeg'

      setIsScanning(true)
      try {
        await onScanReceipt(base64, mediaType)
      } finally {
        setIsScanning(false)
        inputRef.current?.focus()
      }
    }
    reader.readAsDataURL(file)
  }

  const isBusy = isParsing || isScanning

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Hidden file input for receipt scanning */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        {/* Glow effect behind input */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl -z-10"
            />
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative">
          <div
            className={`relative flex items-center rounded-2xl border transition-all duration-300 ${
              isBusy
                ? 'border-blue-500/50 bg-slate-900/90'
                : isFocused
                ? 'border-blue-500 bg-slate-900'
                : 'border-slate-700/80 bg-slate-900/60'
            }`}
            style={isFocused ? {
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15), 0 0 40px rgba(59, 130, 246, 0.08)'
            } : {}}
          >
            {/* Shimmer overlay while busy */}
            {isBusy && (
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.05) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            )}

            {/* Left icon */}
            <div className="pl-5 pr-3 flex-shrink-0">
              {isBusy ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              ) : (
                <Sparkles className={`w-5 h-5 transition-colors duration-200 ${
                  isFocused ? 'text-blue-400' : 'text-slate-500'
                }`} />
              )}
            </div>

            {/* Input */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isBusy || disabled}
                className="w-full bg-transparent text-white text-base sm:text-lg py-3 sm:py-4 pr-4 focus:outline-none disabled:opacity-70 font-body placeholder-transparent"
                placeholder={placeholder}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />

              {!value && !isFocused && (
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  <span className="text-slate-500 text-lg font-body">
                    {placeholder}
                    <span className="cursor-blink ml-0.5 text-slate-600">|</span>
                  </span>
                </div>
              )}
              {!value && isFocused && (
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  <span className="text-slate-600 text-lg font-body">
                    Type an expense... Press Enter to parse
                  </span>
                </div>
              )}
            </div>

            {/* Right buttons */}
            <div className="pr-3 flex items-center gap-2">
              {/* Camera / receipt scan button */}
              {onScanReceipt && (
                <motion.button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={isBusy || disabled}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Scan receipt"
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isBusy || disabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </motion.button>
              )}

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={!value.trim() || isBusy || disabled}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 font-heading ${
                  value.trim() && !isBusy
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Parsing</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>

        {/* Date chip */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500 font-body">Adding for:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker(v => !v)}
              className="text-xs text-blue-400 hover:text-blue-300 font-body flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full"
            >
              {isToday(selectedDate) ? 'Today' : formatShort(selectedDate)}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showDatePicker && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-10 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-xl">
                <input
                  type="date"
                  value={selectedDate}
                  max={todayISO()}
                  onChange={e => { setSelectedDate(e.target.value); setShowDatePicker(false) }}
                  className="bg-transparent text-white text-sm font-body focus:outline-none [color-scheme:dark]"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        {/* Status text */}
        <AnimatePresence>
          {isParsing && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-center text-blue-400 text-sm mt-3 font-body"
            >
              ✨ Claude is parsing your expense...
            </motion.p>
          )}
          {isScanning && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-center text-blue-400 text-sm mt-3 font-body"
            >
              📷 Scanning receipt with Claude Vision...
            </motion.p>
          )}
        </AnimatePresence>

        {/* Hint text */}
        {!isBusy && (
          <p className="text-center text-slate-600 text-xs mt-3 font-body">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 text-xs border border-slate-700">Enter</kbd> to add
            {onScanReceipt && <> • <Camera className="w-3 h-3 inline mb-0.5 mx-0.5" /> to scan a receipt</>}
            {' '}• Claude auto-parses category, vendor &amp; date
          </p>
        )}
      </motion.div>
    </div>
  )
}
