import { useEffect, useRef, useState } from 'react'

interface TermLine {
  text: string
  type: 'prompt' | 'info' | 'success' | 'data' | 'header' | 'divider' | 'metric' | 'recommendation' | 'dim'
  delay: number
}

const DEMO_LINES: TermLine[] = [
  { text: '$ tonquant autoresearch run --asset TON/USDT --factors rsi,macd,volatility', type: 'prompt', delay: 0 },
  { text: '', type: 'dim', delay: 600 },
  { text: '  Autoresearch', type: 'header', delay: 800 },
  { text: '  ────────────────────────────────────────────────', type: 'divider', delay: 900 },
  { text: '  Status: SUCCESS', type: 'success', delay: 1100 },
  { text: '', type: 'dim', delay: 1200 },
  { text: '  \u2713 data fetch      90 bars for TON/USDT', type: 'success', delay: 1500 },
  { text: '  \u2713 factor compute  3 factors computed', type: 'success', delay: 2100 },
  { text: '  \u2713 backtest        14.91% return, sharpe 2.0938', type: 'success', delay: 2800 },
  { text: '  \u2713 report          Report generated', type: 'success', delay: 3400 },
  { text: '', type: 'dim', delay: 3600 },
  { text: '  ────────────────────────────────────────────────', type: 'divider', delay: 3700 },
  { text: '  Metric           Value', type: 'dim', delay: 3900 },
  { text: '  ─────────────    ──────', type: 'divider', delay: 3950 },
  { text: '  Recommendation   BUY', type: 'recommendation', delay: 4200 },
  { text: '  Sharpe Ratio     2.0938', type: 'metric', delay: 4500 },
  { text: '  Total Return     +14.91%', type: 'metric', delay: 4700 },
  { text: '  Max Drawdown     3.21%', type: 'data', delay: 4900 },
  { text: '  Win Rate         66.7%', type: 'data', delay: 5100 },
  { text: '  Trades           3', type: 'data', delay: 5200 },
  { text: '', type: 'dim', delay: 5400 },
  { text: '  Factors:', type: 'header', delay: 5600 },
  { text: '    rsi:        58.42', type: 'data', delay: 5800 },
  { text: '    macd:       0.052341', type: 'data', delay: 5950 },
  { text: '    volatility: 27.24%', type: 'data', delay: 6100 },
  { text: '', type: 'dim', delay: 6300 },
  { text: '  Report: ~/.tonquant/quant/autoresearch/report.md', type: 'info', delay: 6500 },
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
