import { BookOpen, RotateCcw, Settings2, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

const QUICK_QUESTIONS = [
  'האם מותר לחמם מרק בשבת על פלטה?',
  'מה עושים אם שכחתי יעלה ויבוא בתפילה?',
  'איך בודקים ירקות עלים מחרקים?',
  'מתי מדליקים נרות חנוכה בערב שבת?',
]

const VARIANTS = ['text+hagah', 'text+hilchot_group', 'text_only']

export default function Sidebar({ settings, onSettingsChange, onQuickQuestion, onClear }) {
  const [variantsOpen, setVariantsOpen] = useState(false)

  return (
    <aside className="flex flex-col h-full bg-gradient-to-b from-[#10231f] via-[#153f3a] to-[#3a2206] text-slate-100 p-5 gap-5 overflow-hidden">

      {/* Brand */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <BookOpen size={22} className="text-amber-300" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold leading-tight">שאלת חכם</h1>
          <p className="text-xs text-slate-400 mt-0.5">RAG · שולחן ערוך</p>
        </div>
      </div>

      <div className="h-px bg-white/10 flex-shrink-0" />

      {/* Settings */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Settings2 size={12} />
          הגדרות
        </div>

        {/* RAG toggle */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">שימוש ב-RAG</span>
          <button
            onClick={() => onSettingsChange({ useRag: !settings.useRag })}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
              settings.useRag ? 'bg-teal-DEFAULT' : 'bg-white/20'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
              settings.useRag ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </label>

        {/* Top K */}
        {settings.useRag && (
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-300">מספר קטעים (K)</span>
            <select
              value={settings.topK}
              onChange={e => onSettingsChange({ topK: Number(e.target.value) })}
              className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-teal-DEFAULT/60"
            >
              {[1, 3, 5, 10].map(k => <option key={k} value={k}>K = {k}</option>)}
            </select>
          </label>
        )}

        {/* Variant */}
        {settings.useRag && (
          <div>
            <button
              onClick={() => setVariantsOpen(v => !v)}
              className="w-full flex items-center justify-between text-sm text-slate-300 hover:text-white transition-colors"
            >
              <span>וריאנט: <span className="text-teal-light font-medium">{settings.typeText}</span></span>
              <ChevronDown size={14} className={`transition-transform ${variantsOpen ? 'rotate-180' : ''}`} />
            </button>
            {variantsOpen && (
              <div className="mt-2 flex flex-col gap-1">
                {VARIANTS.map(v => (
                  <button
                    key={v}
                    onClick={() => { onSettingsChange({ typeText: v }); setVariantsOpen(false) }}
                    className={`text-right text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      settings.typeText === v
                        ? 'bg-teal-DEFAULT/30 text-teal-light font-semibold'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-white/10 flex-shrink-0" />

      {/* Quick questions */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex-shrink-0">
          שאלות מהירות
        </div>
        <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-thin">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => onQuickQuestion(q)}
              className="text-right text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/12 border border-white/10 hover:border-amber-300/30 rounded-xl px-3 py-2.5 transition-all duration-150 leading-relaxed"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      <button
        onClick={onClear}
        className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-rose-300 hover:bg-rose-900/20 border border-white/10 hover:border-rose-500/30 rounded-xl py-2.5 transition-all duration-150 flex-shrink-0"
      >
        <RotateCcw size={14} />
        נקה שיחה
      </button>
    </aside>
  )
}
