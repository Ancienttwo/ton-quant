import { useEffect, useRef, useState } from 'react'

interface TermLine {
  text: string
  type: 'prompt' | 'info' | 'success' | 'data' | 'header' | 'divider' | 'metric' | 'recommendation' | 'dim'
  delay: number
}

const DEMO_LINES: TermLine[] = [
  // Scene 1: Price check (~4s)
  { text: '$ tonquant price TON', type: 'prompt', delay: 0 },
  { text: '  TON (TON)', type: 'header', delay: 1800 },
  { text: '    Price:     $1.30', type: 'data', delay: 2100 },
  { text: '    Volume:    $1,644,061', type: 'data', delay: 2300 },
  { text: '', type: 'dim', delay: 3500 },

  // Scene 2: Autoresearch command (~2s typing)
  { text: '$ tonquant autoresearch run --asset TON/USDT --factors rsi,macd,volatility', type: 'prompt', delay: 4500 },
  { text: '', type: 'dim', delay: 6500 },

  // Scene 3: Pipeline header (~1s)
  { text: '  Autoresearch', type: 'header', delay: 7000 },
  { text: '  ────────────────────────────────────────────────', type: 'divider', delay: 7200 },
  { text: '  Status: SUCCESS', type: 'success', delay: 7800 },
  { text: '', type: 'dim', delay: 8200 },

  // Scene 4: Pipeline steps — each step takes ~1.5s (simulates real computation)
  { text: '  \u2713 data fetch      90 bars for TON/USDT', type: 'success', delay: 9000 },
  { text: '  \u2713 factor compute  3 factors computed', type: 'success', delay: 10800 },
  { text: '  \u2713 backtest        +12.35% return, sharpe 1.84', type: 'success', delay: 12500 },
  { text: '  \u2713 report          Report generated', type: 'success', delay: 14000 },
  { text: '', type: 'dim', delay: 14800 },

  // Scene 5: Metrics table (~4s)
  { text: '  ────────────────────────────────────────────────', type: 'divider', delay: 15200 },
  { text: '  Metric           Value', type: 'dim', delay: 15600 },
  { text: '  ─────────────    ──────', type: 'divider', delay: 15800 },
  { text: '  Recommendation   BUY', type: 'recommendation', delay: 16500 },
  { text: '  Sharpe Ratio     1.8402', type: 'metric', delay: 17200 },
  { text: '  Total Return     +12.35%', type: 'metric', delay: 17800 },
  { text: '  Max Drawdown     4.12%', type: 'data', delay: 18300 },
  { text: '  Win Rate         66.7%', type: 'data', delay: 18700 },
  { text: '  Trades           3', type: 'data', delay: 19000 },
  { text: '', type: 'dim', delay: 19500 },

  // Scene 6: Factor summary (~2s)
  { text: '  Factors:', type: 'header', delay: 20000 },
  { text: '    rsi:        58.42', type: 'data', delay: 20500 },
  { text: '    macd:       0.052341', type: 'data', delay: 20900 },
  { text: '    volatility: 27.24%', type: 'data', delay: 21300 },
  { text: '', type: 'dim', delay: 22000 },

  // Scene 7: Report path
  { text: '  Report: ~/.tonquant/quant/autoresearch/report.md', type: 'info', delay: 22500 },
]

const TYPE_COLORS: Record<string, string> = {
  prompt: 'var(--neutral-100)',
  info: 'var(--info)',
  success: 'var(--success)',
  data: 'var(--primary)',
  header: 'var(--primary)',
  divider: 'var(--neutral-30)',
  metric: 'var(--primary)',
  recommendation: 'var(--success)',
  dim: 'var(--neutral-60)',
}

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Intersection observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed) {
          setIsInView(true)
          setHasPlayed(true)
        }
      },
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasPlayed])

  // Animate lines
  useEffect(() => {
    if (!isInView) return
    const timers: ReturnType<typeof setTimeout>[] = []
    DEMO_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1)
        }, line.delay),
      )
    })
    return () => timers.forEach(clearTimeout)
  }, [isInView])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleLines])

  const renderLine = (line: TermLine, index: number) => {
    if (line.type === 'prompt') {
      const parts = line.text.split(' ')
      return (
        <div key={index} className="term-line" style={{ animationDelay: `${index * 30}ms` }}>
          <span style={{ color: 'var(--secondary)' }}>{parts[0]}</span>{' '}
          <span style={{ color: 'var(--primary)' }}>{parts[1]}</span>{' '}
          <span style={{ color: 'var(--neutral-80)' }}>{parts.slice(2).join(' ')}</span>
        </div>
      )
    }
    if (line.type === 'recommendation') {
      const parts = line.text.split('BUY')
      return (
        <div key={index} className="term-line term-line-enter">
          <span style={{ color: 'var(--neutral-60)' }}>{parts[0]}</span>
          <span className="recommendation-badge">BUY</span>
        </div>
      )
    }
    if (line.type === 'metric') {
      const value = line.text.match(/[\d.+%-]+$/)?.[0] ?? ''
      const label = line.text.replace(value, '')
      const isPositive = value.startsWith('+') || (parseFloat(value) > 1 && !value.includes('%'))
      return (
        <div key={index} className="term-line term-line-enter">
          <span style={{ color: 'var(--neutral-60)' }}>{label}</span>
          <span style={{ color: isPositive ? 'var(--success)' : 'var(--primary)' }}>{value}</span>
        </div>
      )
    }
    return (
      <div
        key={index}
        className="term-line term-line-enter"
        style={{ color: TYPE_COLORS[line.type] ?? 'var(--neutral-80)' }}
      >
        {line.text || '\u00A0'}
      </div>
    )
  }

  return (
    <div className="terminal" ref={containerRef}>
      <div className="terminal-chrome">
        <div className="terminal-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="terminal-title">tonquant</span>
        <div style={{ width: 52 }} />
      </div>
      <div className="terminal-body" ref={scrollRef}>
        {DEMO_LINES.slice(0, visibleLines).map((line, i) => renderLine(line, i))}
        {visibleLines < DEMO_LINES.length && (
          <span className="cursor">_</span>
        )}
      </div>
    </div>
  )
}
