import { TerminalDemo } from './components/TerminalDemo'
import './App.css'

function App() {
  return (
    <>
      <div className="grid-bg" />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <span className="nav-logo">
            <span className="nav-logo-bracket">[</span>
            TonQuant
            <span className="nav-logo-bracket">]</span>
          </span>
          <div className="nav-links">
            <a href="https://github.com/Ancienttwo/ton-quant" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="#demo" className="nav-cta">Live Demo</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="badge-dot" />
            TON AI Agent Hackathon &middot; Track 1: Agent Infrastructure
          </div>

          <h1 className="hero-title">
            AI Agents do
            <br />
            <span className="hero-accent">quant research</span>
            <br />
            on TON
          </h1>

          <p className="hero-sub">
            One command. Zero human intervention.<br />
            Data &rarr; Factors &rarr; Backtest &rarr; Report.
          </p>

          <div className="hero-cmd">
            <code>
              <span className="cmd-prompt">$</span>{' '}
              tonquant autoresearch run --asset TON/USDT --json
            </code>
          </div>

          <div className="hero-actions">
            <a href="https://github.com/Ancienttwo/ton-quant" target="_blank" rel="noreferrer" className="btn btn-primary">
              View on GitHub
            </a>
            <a href="#demo" className="btn btn-ghost">
              See it work &darr;
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="stats-inner">
          <div className="stat">
            <span className="stat-value">5</span>
            <span className="stat-label">Factor Types</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">3</span>
            <span className="stat-label">Strategy Presets</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">135</span>
            <span className="stat-label">Tests Passing</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">&lt;2s</span>
            <span className="stat-label">Full Pipeline</span>
          </div>
        </div>
      </section>

      {/* Terminal Demo */}
      <section className="demo" id="demo">
        <div className="demo-inner">
          <h2 className="section-title">
            <span className="section-tag">LIVE</span>
            Agent-Driven Research Loop
          </h2>
          <p className="section-sub">
            Watch the complete pipeline: fetch market data, compute technical factors,
            run strategy backtest, and generate a research report — all from a single command.
          </p>
          <TerminalDemo />
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-inner">
          <h2 className="section-title">Built for Agents</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">{"{ }"}</div>
              <h3>JSON-First Output</h3>
              <p>Every command supports <code>--json</code> for structured agent consumption. Zod-validated contracts.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&gt;_</div>
              <h3>CLI Native</h3>
              <p>No SDK, no API key. Install with <code>bun install</code>, call from any agent framework.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&#x25B3;</div>
              <h3>Full Quant Pipeline</h3>
              <p>RSI, MACD, volatility factors. Momentum backtesting with Sharpe, Calmar, Sortino ratios.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&#x2699;</div>
              <h3>Pluggable Backend</h3>
              <p>TS mock backend for demo. Swap to Python+pandas for production via subprocess boundary.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="quickstart" id="quickstart">
        <div className="quickstart-inner">
          <h2 className="section-title">Quick Start</h2>
          <p className="section-sub">
            From zero to your first quant research report in 3 steps.
          </p>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Install</h3>
                <div className="step-code">
                  <code>
                    <span className="code-comment"># Requires Bun runtime (https://bun.sh)</span>
                    {'\n'}bun install -g tonquant
                  </code>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Explore the market</h3>
                <div className="step-code">
                  <code>
                    <span className="code-comment"># Check TON price</span>
                    {'\n'}tonquant price TON
                    {'\n'}
                    {'\n'}<span className="code-comment"># See trending tokens</span>
                    {'\n'}tonquant trending --limit 5
                    {'\n'}
                    {'\n'}<span className="code-comment"># View available strategy presets</span>
                    {'\n'}tonquant preset list
                  </code>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Run your first research</h3>
                <div className="step-code">
                  <code>
                    <span className="code-comment"># Full pipeline: data → factors → backtest → report</span>
                    {'\n'}tonquant autoresearch run --asset TON/USDT
                    {'\n'}
                    {'\n'}<span className="code-comment"># Or get JSON output for your AI agent</span>
                    {'\n'}tonquant autoresearch run --asset TON/USDT --json
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="quickstart-note">
            <span className="note-icon">i</span>
            All commands support <code>--json</code> flag for structured output.
            See <a href="https://github.com/Ancienttwo/ton-quant/blob/main/skill/SKILL.md" target="_blank" rel="noreferrer">SKILL.md</a> for
            the full command reference and agent integration guide.
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="arch">
        <div className="arch-inner">
          <h2 className="section-title">Architecture</h2>
          <pre className="arch-diagram">{`
  External Agent (OpenClaw / Claude Code)
    |
    v
  tonquant autoresearch run --asset TON/USDT
    |
    v
  Orchestrator
    |--- preset show  --> load strategy params
    |--- data fetch   --> OHLCV market data
    |--- factor compute --> RSI, MACD, volatility
    |--- backtest run --> momentum strategy
    |
    v
  Research Report (.md)
  + JSON metrics { sharpe, return, recommendation }
          `}</pre>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-inner">
          <h2>Start researching TON in 30 seconds</h2>
          <div className="cta-cmd">
            <code>bun install -g tonquant &amp;&amp; tonquant autoresearch run --asset TON/USDT</code>
          </div>
          <a href="https://github.com/Ancienttwo/ton-quant" target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
            Get Started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-logo">[TonQuant]</span>
          <span className="footer-text">TON AI Agent Hackathon 2026</span>
          <span className="footer-text">MIT License</span>
        </div>
      </footer>
    </>
  )
}

export default App
