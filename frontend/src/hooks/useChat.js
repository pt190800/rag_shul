import { useState, useCallback } from 'react'

const API_BASE = '/api'

export function useChat() {
  const [messages, setMessages]   = useState([])   // { role, content, chunks? }
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [settings, setSettings]   = useState({
    useRag:   true,
    topK:     3,
    typeText: 'text+hagah',
  })

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setError(null)

    // Build history for API (without chunks)
    const history = [...messages, userMsg].map(m => ({
      role: m.role, content: m.content,
    }))

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:  history,
          use_rag:   settings.useRag,
          top_k:     settings.topK,
          type_text: settings.typeText,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `שגיאת שרת ${res.status}`)

      setMessages(prev => [...prev, {
        role:   'assistant',
        content: data.reply,
        chunks:  data.chunks || [],
      }])
    } catch (err) {
      setError(err.message)
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: null,
        error:   err.message,
      }])
    } finally {
      setLoading(false)
    }
  }, [messages, loading, settings])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, loading, error, settings, setSettings, sendMessage, clearChat }
}
