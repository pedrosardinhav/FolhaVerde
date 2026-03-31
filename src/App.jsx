import { AnimatePresence, motion } from 'framer-motion'
import dayjs from 'dayjs'
import localeData from 'dayjs/plugin/localeData'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import updateLocale from 'dayjs/plugin/updateLocale'
import 'dayjs/locale/pt-br'
import { useEffect, useMemo, useRef, useState } from 'react'

dayjs.extend(localeData)
dayjs.extend(localizedFormat)
dayjs.extend(updateLocale)
dayjs.locale('pt-br')
dayjs.updateLocale('pt-br', {
  months: [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ],
})

const STORAGE_KEYS = {
  userName: 'green-paper:user-name',
  entries: 'green-paper:entries',
  dailyQuote: 'green-paper:daily-quote',
}

const FALLBACK_QUOTES = [
  {
    text: 'Cada página escrita com sinceridade ajuda a clarear o coração.',
    author: '',
  },
  {
    text: 'Pequenos registros de hoje viram memória valiosa amanhã.',
    author: '',
  },
  {
    text: 'Cuidar dos pensamentos também é uma forma de descanso.',
    author: '',
  },
]

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function createEmptyEntry() {
  return {
    journal: '',
    todos: [],
  }
}

function normalizeQuote(quote) {
  if (!quote) return null

  return {
    ...quote,
    author: quote.author === 'Folha Verde' ? '' : quote.author ?? '',
  }
}

function formatReadableDate(dateKey) {
  const date = dayjs(dateKey)
  const month = date.format('MMMM')
  return `${date.date()} de ${month}`
}

function buildCalendarDays(baseDate) {
  const monthStart = baseDate.startOf('month')
  const startWeekday = (monthStart.day() + 6) % 7
  const gridStart = monthStart.subtract(startWeekday, 'day')

  return Array.from({ length: 42 }, (_, index) => gridStart.add(index, 'day'))
}

function pickFallbackQuote(dateKey) {
  const numericSeed = Number(dateKey.replaceAll('-', ''))
  return FALLBACK_QUOTES[numericSeed % FALLBACK_QUOTES.length]
}

function App() {
  const todayKey = dayjs().format('YYYY-MM-DD')
  const [userName, setUserName] = useState(() => {
    if (typeof window === 'undefined') return ''
    return readStorage(STORAGE_KEYS.userName, '')
  })
  const [entries, setEntries] = useState(() => {
    if (typeof window === 'undefined') return {}
    return readStorage(STORAGE_KEYS.entries, {})
  })
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [journalDraft, setJournalDraft] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => dayjs())
  const [quote, setQuote] = useState(() => {
    if (typeof window === 'undefined') return null
    return normalizeQuote(readStorage(STORAGE_KEYS.dailyQuote, null))
  })
  const journalTimeoutRef = useRef(null)

  const currentEntry = entries[selectedDate] ?? createEmptyEntry()
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth])
  const entryDates = useMemo(() => new Set(Object.keys(entries)), [entries])

  useEffect(() => {
    setJournalDraft(currentEntry.journal)
  }, [selectedDate, currentEntry.journal])

  useEffect(() => {
    if (!userName) return
    writeStorage(STORAGE_KEYS.userName, userName)
  }, [userName])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.entries, entries)
  }, [entries])

  useEffect(() => {
    if (quote?.date === todayKey) return

    let isActive = true

    async function loadQuote() {
      const cached = readStorage(STORAGE_KEYS.dailyQuote, null)
      if (cached?.date === todayKey) {
        const normalizedCached = normalizeQuote(cached)
        setQuote(normalizedCached)
        writeStorage(STORAGE_KEYS.dailyQuote, normalizedCached)
        return
      }

      try {
        const response = await fetch('https://api.quotable.io/random')
        if (!response.ok) {
          throw new Error('quote request failed')
        }

        const data = await response.json()
        const nextQuote = {
          date: todayKey,
          text: data.content,
          author: data.author,
        }

        if (!isActive) return

        const normalizedQuote = normalizeQuote(nextQuote)
        setQuote(normalizedQuote)
        writeStorage(STORAGE_KEYS.dailyQuote, normalizedQuote)
      } catch {
        const fallback = pickFallbackQuote(todayKey)
        const nextQuote = {
          date: todayKey,
          text: fallback.text,
          author: fallback.author,
        }

        if (!isActive) return

        const normalizedQuote = normalizeQuote(nextQuote)
        setQuote(normalizedQuote)
        writeStorage(STORAGE_KEYS.dailyQuote, normalizedQuote)
      }
    }

    loadQuote()

    return () => {
      isActive = false
    }
  }, [quote?.date, todayKey])

  useEffect(() => () => {
    if (journalTimeoutRef.current) {
      clearTimeout(journalTimeoutRef.current)
    }
  }, [])

  function updateEntry(dateKey, updater) {
    setEntries((currentEntries) => {
      const previousEntry = currentEntries[dateKey] ?? createEmptyEntry()
      const nextEntry = updater(previousEntry)
      return {
        ...currentEntries,
        [dateKey]: nextEntry,
      }
    })
  }

  function handleJournalChange(value) {
    setJournalDraft(value)

    if (journalTimeoutRef.current) {
      clearTimeout(journalTimeoutRef.current)
    }

    journalTimeoutRef.current = setTimeout(() => {
      updateEntry(selectedDate, (entry) => ({
        ...entry,
        journal: value,
      }))
    }, 800)
  }

  function handleTodoChange(todoId, text) {
    updateEntry(selectedDate, (entry) => ({
      ...entry,
      todos: entry.todos.map((todo) =>
        todo.id === todoId ? { ...todo, text } : todo,
      ),
    }))
  }

  function handleTodoToggle(todoId) {
    updateEntry(selectedDate, (entry) => ({
      ...entry,
      todos: entry.todos.map((todo) =>
        todo.id === todoId ? { ...todo, done: !todo.done } : todo,
      ),
    }))
  }

  function handleAddTodo() {
    updateEntry(selectedDate, (entry) => ({
      ...entry,
      todos: [
        ...entry.todos,
        {
          id: Date.now(),
          text: '',
          done: false,
        },
      ],
    }))
  }

  function handleRemoveTodo(todoId) {
    updateEntry(selectedDate, (entry) => ({
      ...entry,
      todos: entry.todos.filter((todo) => todo.id !== todoId),
    }))
  }

  function handleNameSubmit(formData) {
    const name = formData.get('name')?.toString().trim()
    if (!name) return
    setUserName(name)
  }

  function handleSelectDate(dateKey) {
    setSelectedDate(dateKey)
    setCalendarMonth(dayjs(dateKey))
    setIsCalendarOpen(false)
  }

  return (
    <div className="app-shell">
      <div className="background-orb orb-left" />
      <div className="background-orb orb-right" />

      <AnimatePresence mode="wait">
        {!userName ? (
          <WelcomeScreen key="welcome" onSubmit={handleNameSubmit} />
        ) : (
          <MainScreen
            key="main"
            userName={userName}
            selectedDate={selectedDate}
            journalDraft={journalDraft}
            onJournalChange={handleJournalChange}
            todos={currentEntry.todos}
            onTodoChange={handleTodoChange}
            onTodoToggle={handleTodoToggle}
            onTodoRemove={handleRemoveTodo}
            onAddTodo={handleAddTodo}
            quote={quote}
            isCalendarOpen={isCalendarOpen}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onCloseCalendar={() => setIsCalendarOpen(false)}
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
            calendarDays={calendarDays}
            entryDates={entryDates}
            onSelectDate={handleSelectDate}
            todayKey={todayKey}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function WelcomeScreen({ onSubmit }) {
  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(new FormData(event.currentTarget))
  }

  return (
    <motion.main
      className="welcome-screen panel"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <p className="eyebrow">Seu espaço para respirar e registrar</p>
      <h1>Folha Verde</h1>
      <p className="welcome-copy">
        Um journal aconchegante para escrever o dia, organizar tarefas e
        revisitar momentos pelo calendário.
      </p>

      <form className="welcome-form" onSubmit={handleSubmit}>
        <label htmlFor="name">Como você quer ser chamado?</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Digite seu nome"
          autoComplete="given-name"
          required
        />
        <button type="submit">Entrar no meu cantinho</button>
      </form>
    </motion.main>
  )
}

function MainScreen(props) {
  const {
    userName,
    selectedDate,
    journalDraft,
    onJournalChange,
    todos,
    onTodoChange,
    onTodoToggle,
    onTodoRemove,
    onAddTodo,
    quote,
    isCalendarOpen,
    onOpenCalendar,
    onCloseCalendar,
    calendarMonth,
    setCalendarMonth,
    calendarDays,
    entryDates,
    onSelectDate,
    todayKey,
  } = props

  return (
    <motion.main
      className="main-layout"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <section className="journal-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Olá, {userName}</p>
            <h1>O que você tem pra hoje?</h1>
          </div>

          <button className="date-trigger" type="button" onClick={onOpenCalendar}>
            {selectedDate === todayKey ? 'Hoje' : 'Dia selecionado'}: {formatReadableDate(selectedDate)}
          </button>
        </div>

        <textarea
          className="journal-input"
          value={journalDraft}
          onChange={(event) => onJournalChange(event.target.value)}
          placeholder="Pelo que você é grato hoje, o que pretende fazer e qual é a sua inspiração?"
        />
      </section>

      <aside className="sidebar">
        <section className="sidebar-card quote-card">
          <p className="card-title">Citação do dia</p>
          <p className="quote-text">"{quote?.text ?? 'Buscando uma frase calma para hoje...'}"</p>
          {quote?.author ? <p className="quote-author">{quote.author}</p> : null}
        </section>

        <section className="sidebar-card todos-card">
          <h2>Suas tarefas</h2>

          <div className="todo-list">
            {todos.length === 0 ? (
              <p className="empty-state">Nenhuma tarefa por aqui ainda.</p>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className={`todo-item ${todo.done ? 'is-done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => onTodoToggle(todo.id)}
                  />
                  <input
                    className="todo-text"
                    type="text"
                    value={todo.text}
                    onChange={(event) => onTodoChange(todo.id, event.target.value)}
                    placeholder="Escreva uma tarefa"
                  />
                  <button
                    className="todo-remove"
                    type="button"
                    aria-label="Remover tarefa"
                    onClick={() => onTodoRemove(todo.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <button className="add-todo" type="button" onClick={onAddTodo}>
            + adicionar tarefa
          </button>
        </section>
      </aside>

      <AnimatePresence>
        {isCalendarOpen ? (
          <CalendarOverlay
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
            calendarDays={calendarDays}
            entryDates={entryDates}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            onClose={onCloseCalendar}
          />
        ) : null}
      </AnimatePresence>
    </motion.main>
  )
}

function CalendarOverlay({
  calendarMonth,
  setCalendarMonth,
  calendarDays,
  entryDates,
  selectedDate,
  onSelectDate,
  onClose,
}) {
  const weekDays = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
  const today = dayjs()
  const isCurrentCalendarMonth =
    calendarMonth.month() === today.month() &&
    calendarMonth.year() === today.year()

  return (
    <motion.div
      className="calendar-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: 'linear' }}
      onClick={onClose}
    >
      <motion.div
        className="calendar-panel panel"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="calendar-header">
          <button type="button" onClick={() => setCalendarMonth((current) => current.subtract(1, 'month'))}>
            anterior
          </button>
          <h2>{calendarMonth.format('MMMM [de] YYYY')}</h2>
          <button
            type="button"
            disabled={isCurrentCalendarMonth}
            onClick={() => setCalendarMonth((current) => current.add(1, 'month'))}
          >
            próximo
          </button>
        </div>

        <div className="calendar-grid calendar-weekdays">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((date) => {
            const dateKey = date.format('YYYY-MM-DD')
            const isCurrentMonth =
              date.month() === calendarMonth.month() &&
              date.year() === calendarMonth.year()
            const hasEntry = entryDates.has(dateKey)
            const isSelected = dateKey === selectedDate
            const isFutureDate = date.isAfter(today, 'day')

            return (
              <button
                key={dateKey}
                type="button"
                disabled={isFutureDate}
                className={`calendar-day ${isCurrentMonth ? '' : 'is-muted'} ${isSelected ? 'is-selected' : ''} ${isFutureDate ? 'is-disabled' : ''}`}
                onClick={() => onSelectDate(dateKey)}
              >
                <span>{date.date()}</span>
                {hasEntry ? <i className="entry-dot" /> : null}
              </button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default App
