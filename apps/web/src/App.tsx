import { TerminalDemo } from "./components/TerminalDemo";
import { MarketplaceSection } from "./components/MarketplaceSection";
import "./App.css";

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
            <a href="#quickstart" className="nav-cta">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="badge-dot" />
            Open Protocol for Quantitative Factors
          </div>

          <h1 className="hero-title">
            npm for
            <br />
            <span className="hero-accent">trading factors</span>
          </h1>

          <p className="hero-sub">
            Publish, discover, and compose quantitative factors.
            <br />
            AI Agents search the registry, validate with backtests, and compose strategies.
          </p>

          <div className="hero-cmd">
            <code>
              <span className="cmd-prompt">$</span> tonquant factor top --json
            </code>
          </div>

          <div className="hero-actions">
            <a
              href="https://github.com/Ancienttwo/ton-quant"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              View on GitHub
            </a>
            <a href="#marketplace" className="btn btn-ghost">
              Browse Factors &darr;
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="stats-inner">
          <div className="stat">
            <span className="stat-value">Open</span>
            <span className="stat-label">Registry</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">6</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">1-Click</span>
            <span className="stat-label">Backtest</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-value">--json</span>
            <span className="stat-label">Agent-Native</span>
          </div>
        </div>
      </section>

      {/* Terminal Demo */}
      <section className="demo" id="demo">
        <div className="demo-inner">
          <h2 className="section-title">
            <span className="section-tag">LIVE</span>
            Factor Marketplace in Action
          </h2>
          <p className="section-sub">
            Watch the full flow: browse the leaderboard, search factors, verify with backtest, and
            compose a strategy &mdash; all from the terminal.
          </p>
          <TerminalDemo />
        </div>
      </section>

      {/* Interactive Marketplace */}
      <MarketplaceSection />

      {/* Features */}
      <section className="features">
        <div className="features-inner">
          <h2 className="section-title">Built for Agents</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">&#x2630;</div>
              <h3>Factor Registry</h3>
              <p>
                Publish and discover quantitative factors. Zod-validated schemas, local-first
                storage.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&#x25B2;</div>
              <h3>Leaderboard</h3>
              <p>
                Factors ranked by Sharpe ratio. See what works &mdash; backtest-verified
                performance.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">+</div>
              <h3>Factor Composition</h3>
              <p>
                Combine factors with weighted algebra. Composed factors become first-class registry
                entries.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">{"{ }"}</div>
              <h3>Agent-Native</h3>
              <p>
                Every command supports <code>--json</code>. Any AI Agent framework can natively
                consume the registry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="quickstart" id="quickstart">
        <div className="quickstart-inner">
          <h2 className="section-title">Quick Start</h2>
          <p className="section-sub">From zero to your first factor strategy in 3 steps.</p>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Install</h3>
                <div className="step-code">
                  <code>
                    <span className="code-comment"># Requires Bun runtime (https://bun.sh)</span>
                    {"\n"}bun install -g tonquant
                  </code>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Discover factors</h3>
                <div className="step-code">
                  <code>
                    <span className="code-comment"># Browse the leaderboard</span>
                    {"\n"}tonquant factor top
                    {"\n"}
                    {"\n"}
                    <span className="code-comment"># Search by category</span>
                    {"\n"}tonquant factor discover --category momentum
                  </code>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Validate &amp; compose</h3>
                <div className="step-code">
                  <code>
                    <span className="code-comment"># One-click backtest</span>
                    {"\n"}tonquant factor backtest ton_momentum_1d --period 90d
                    {"\n"}
                    {"\n"}
                    <span className="code-comment"># Compose a strategy from multiple factors</span>
                    {"\n"}tonquant factor compose \{"\n"}
                    {"  "}--factors ton_momentum_1d:0.6,not_vol_revert:0.4 --json
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="quickstart-note">
            <span className="note-icon">i</span>
            All commands support <code>--json</code> flag for structured output. See{" "}
            <a
              href="https://github.com/Ancienttwo/ton-quant/blob/main/skill/SKILL.md"
              target="_blank"
              rel="noreferrer"
            >
              SKILL.md
            </a>{" "}
            for the full command reference and agent integration guide.
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="arch">
        <div className="arch-inner">
          <h2 className="section-title">Architecture</h2>
          <pre className="arch-diagram">{`
  AI Agent (OpenClaw / Claude Code / Any Framework)
    |
    v
  tonquant factor top --json            ← discover
    |
    v
  Factor Registry (~/.tonquant/registry/)
    |--- factor discover  --> search & filter
    |--- factor backtest  --> verify performance
    |--- factor compose   --> weighted algebra
    |--- factor report    --> social proof
    |
    v
  Strategy = f(factor₁ × w₁ + factor₂ × w₂ + ...)
          `}</pre>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-inner">
          <h2>Find alpha in 30 seconds</h2>
          <div className="cta-cmd">
            <code>bun install -g tonquant &amp;&amp; tonquant factor top</code>
          </div>
          <a
            href="https://github.com/Ancienttwo/ton-quant"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-lg"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-logo">[TonQuant]</span>
          <span className="footer-text">Agent-Native Factor Marketplace</span>
          <span className="footer-text">MIT License</span>
        </div>
      </footer>
    </>
  );
}

export default App;
