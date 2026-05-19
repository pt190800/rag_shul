import ReactMarkdown from 'react-markdown'
import SourceChunks from './SourceChunks'

function TypingDots() {
  return (
    <div className="flex gap-1.5 py-1 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gold animate-pulse-dot"
          style={{ animationDelay: `${i * 130}ms` }}
        />
      ))}
    </div>
  )
}

export default function ChatMessage({ message, isLoading }) {
  const isUser = message?.role === 'user'

  if (isLoading) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="bg-white border border-line rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
          <TypingDots />
        </div>
      </div>
    )
  }

  if (isUser) {
    return (
      <div className="flex justify-start animate-fade-up">
        <div className="bg-teal-DEFAULT text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] leading-relaxed text-sm shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  // Assistant
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="bg-white border border-line rounded-2xl rounded-tl-sm px-5 py-4 max-w-[90%] shadow-sm">
        {message.error ? (
          <p className="text-rose-500 text-sm">{message.error}</p>
        ) : (
          <>
            <div className="prose prose-sm max-w-none text-ink leading-relaxed font-sans
              prose-p:my-1 prose-headings:font-serif prose-strong:text-ink
              prose-ul:my-1 prose-li:my-0.5">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            <SourceChunks chunks={message.chunks} />
          </>
        )}
      </div>
    </div>
  )
}
