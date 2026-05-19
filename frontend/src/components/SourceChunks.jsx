import { useState } from 'react'
import { ChevronDown, BookMarked } from 'lucide-react'

function ChunkCard({ chunk }) {
  const [open, setOpen] = useState(false)
  const src = chunk.source

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-white/60 hover:bg-white transition-colors">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-right gap-3"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-light text-teal-dark text-xs font-bold flex items-center justify-center">
            {chunk.rank}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-ink truncate">
              סימן {chunk.siman} · סעיף {chunk.seif}
            </div>
            {src?.hilchot_group && (
              <div className="text-xs text-ink/50 truncate">{src.hilchot_group}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-ink/40 bg-page px-2 py-0.5 rounded-full">
            {(chunk.score * 100).toFixed(0)}%
          </span>
          <ChevronDown
            size={15}
            className={`text-ink/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-line space-y-3 animate-fade-up">
          {src?.siman_sign && (
            <p className="text-xs text-teal-dark font-semibold pt-3">{src.siman_sign}</p>
          )}
          {src?.text && (
            <p className="text-sm text-ink leading-relaxed font-serif">{src.text}</p>
          )}
          {src?.hagah && (
            <div className="bg-gold-light/60 border border-gold/30 rounded-lg px-3 py-2">
              <span className="text-xs font-bold text-gold mr-1">הגה:</span>
              <span className="text-sm text-ink/80 leading-relaxed font-serif">{src.hagah}</span>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <span className="text-xs text-ink/40 bg-page px-2 py-0.5 rounded-full">{chunk.type_text}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SourceChunks({ chunks }) {
  const [open, setOpen] = useState(false)
  if (!chunks?.length) return null

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-teal-dark hover:text-teal-DEFAULT text-sm font-semibold transition-colors"
      >
        <BookMarked size={15} />
        {open ? 'הסתר מקורות' : `הצג מקורות (${chunks.length})`}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2 animate-fade-up">
          {chunks.map((c, i) => <ChunkCard key={i} chunk={c} />)}
        </div>
      )}
    </div>
  )
}
