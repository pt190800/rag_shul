import { useEffect, useRef } from 'react'
import { useChat } from './hooks/useChat'
import Sidebar from './components/Sidebar'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'
import { BookOpen } from 'lucide-react'

function EmptyState({ onQuickQuestion }) {
  const examples = [
    'מה דין ציצית?',
    'האם מותר לחמם מרק בשבת?',
    'מה הדין לגבי כשרות ירקות?',
  ]
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-teal-DEFAULT/10 flex items-center justify-center">
          <BookOpen size={28} className="text-teal-DEFAULT" />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-ink font-bold">שאלת חכם</h2>
          <p className="text-ink/50 text-sm mt-1">שאל שאלה הלכתית וקבל תשובה מבוססת שולחן ערוך</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {examples.map(q => (
          <button
            key={q}
            onClick={() => onQuickQuestion(q)}
            className="text-sm text-teal-dark bg-teal-light/40 hover:bg-teal-light border border-teal-DEFAULT/20 hover:border-teal-DEFAULT/40 px-4 py-2 rounded-full transition-all duration-150"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { messages, loading, settings, setSettings, sendMessage, clearChat } = useChat()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleSettingsChange(patch) {
    setSettings(s => ({ ...s, ...patch }))
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans">

      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 hidden md:block">
        <Sidebar
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onQuickQuestion={sendMessage}
          onClear={clearChat}
        />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 bg-page">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {messages.length === 0 && !loading ? (
              <EmptyState onQuickQuestion={sendMessage} />
            ) : (
              <>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))}
                {loading && <ChatMessage isLoading />}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} loading={loading} />
      </div>
    </div>
  )
}
