import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

export default function ChatInput({ onSend, loading }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!loading && textareaRef.current) textareaRef.current.focus()
  }, [loading])

  function handleInput(e) {
    setText(e.target.value)
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px' }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const q = text.trim()
    if (!q || loading) return
    onSend(q)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  return (
    <div className="flex-shrink-0 px-4 pb-5 pt-3 bg-gradient-to-t from-page via-page/95 to-transparent">
      <div className="max-w-3xl mx-auto">
        <div className={`flex items-end gap-2 bg-white border-2 rounded-2xl px-4 py-3 shadow-lg transition-colors duration-150 ${
          loading ? 'border-line' : 'border-line focus-within:border-teal-DEFAULT/50 focus-within:shadow-teal-DEFAULT/10'
        }`}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="שאל שאלה הלכתית..."
            disabled={loading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-ink placeholder:text-ink/30 text-sm leading-relaxed focus:outline-none disabled:opacity-50 font-sans"
            style={{ minHeight: '24px', maxHeight: '140px' }}
          />
          <button
            onClick={submit}
            disabled={loading || !text.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-teal-DEFAULT text-white flex items-center justify-center transition-all duration-150 hover:bg-teal-dark disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={16} className="mr-0.5 mt-0.5" />
          </button>
        </div>
        <p className="text-center text-xs text-ink/25 mt-2">
          Enter לשליחה · Shift+Enter לשורה חדשה
        </p>
      </div>
    </div>
  )
}
