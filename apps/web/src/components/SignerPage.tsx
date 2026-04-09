import { TonConnectButton, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";

interface SigningSessionView {
  sessionId: string;
  action: "publish_factor" | "update_factor" | "set_payout_address";
  factorSlug: string;
  factorVersion?: string;
  publisherAddress: string;
  payoutAddress: string;
  network: "mainnet" | "testnet";
  intentText: string;
  status: "pending" | "completed" | "expired" | "cancelled";
  signUrl: string;
  expiresAt: string;
  createdAt: string;
  publicationId?: string;
}

interface EnvelopeSuccess<T> {
  status: "ok";
  data: T;
}

interface EnvelopeError {
  status: "error";
  error: string;
  code: string;
}

interface PublishResult {
  publicationId: string;
  status: string;
}

interface PayoutResult {
  factorSlug: string;
  payoutAddress: string;
  changedAt: string;
}

function resolvePlatformApiBase(): string {
  const configured = import.meta.env.VITE_PLATFORM_API_BASE_URL as string | undefined;
  return (configured ?? window.location.origin).replace(/\/$/u, "");
}

function resolveSubmissionPath(session: SigningSessionView): string {
  if (session.action === "set_payout_address") {
    return `/v1/factors/${encodeURIComponent(session.factorSlug)}/payout-address`;
  }
  if (session.action === "update_factor") {
    return `/v1/factors/${encodeURIComponent(session.factorSlug)}/update`;
  }
  return "/v1/factors/publish";
}

function networkToTonConnect(session: SigningSessionView): "-239" | "-3" {
  return session.network === "mainnet" ? "-239" : "-3";
}

export function SignerPage() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [session, setSession] = useState<SigningSessionView | null>(null);
  const [apiBase, setApiBase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PublishResult | PayoutResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session");

    if (!sessionId) {
      setError("Missing signing session id.");
      setLoading(false);
      return;
    }

    const normalizedApi = resolvePlatformApiBase();
    setApiBase(normalizedApi);

    void (async () => {
      try {
        const response = await fetch(
          `${normalizedApi}/v1/signing-sessions/${encodeURIComponent(sessionId)}`,
        );
        const payload = (await response.json()) as
          | EnvelopeSuccess<SigningSessionView>
          | EnvelopeError;
        if (!response.ok || payload.status !== "ok") {
          throw new Error(
            payload.status === "error" ? payload.error : "Failed to load signing session.",
          );
        }
        setSession(payload.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSign(): Promise<void> {
    if (!session) return;
    if (!wallet?.account?.publicKey) {
      setError(
        "Connected wallet did not expose a public key. Reconnect with a standard wallet and try again.",
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const signedResult = await tonConnectUI.signData({
        type: "text",
        text: session.intentText,
        network: networkToTonConnect(session),
        from: session.publisherAddress,
      });

      const response = await fetch(`${apiBase}${resolveSubmissionPath(session)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          publicKeyHex: wallet.account.publicKey,
          signedResult,
        }),
      });
      const payload = (await response.json()) as
        | EnvelopeSuccess<PublishResult | PayoutResult>
        | EnvelopeError;
      if (!response.ok || payload.status !== "ok") {
        throw new Error(payload.status === "error" ? payload.error : "Platform submission failed.");
      }
      setResult(payload.data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="signer-page">
        <section className="signer-card">
          <h1>Loading signing session</h1>
        </section>
      </main>
    );
  }

  if (error && !session) {
    return (
      <main className="signer-page">
        <section className="signer-card">
          <h1>Signer unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="signer-page">
      <section className="signer-card">
        <div className="signer-header">
          <div>
            <p className="signer-kicker">TON Wallet Signature</p>
            <h1>{session.factorSlug}</h1>
            <p className="signer-sub">
              {session.action === "set_payout_address"
                ? "Confirm payout destination update"
                : `Authorize ${session.action.replaceAll("_", " ")}`}
            </p>
          </div>
          <TonConnectButton />
        </div>

        <div className="signer-grid">
          <div className="signer-field">
            <span>Action</span>
            <strong>{session.action}</strong>
          </div>
          <div className="signer-field">
            <span>Network</span>
            <strong>{session.network}</strong>
          </div>
          <div className="signer-field">
            <span>Publisher</span>
            <code>{session.publisherAddress}</code>
          </div>
          <div className="signer-field">
            <span>Payout</span>
            <code>{session.payoutAddress}</code>
          </div>
          <div className="signer-field">
            <span>Expires</span>
            <strong>{session.expiresAt}</strong>
          </div>
          <div className="signer-field">
            <span>Status</span>
            <strong>{session.status}</strong>
          </div>
        </div>

        <div className="signer-intent">
          <span>Intent text</span>
          <pre>{session.intentText}</pre>
        </div>

        {error ? <p className="signer-error">{error}</p> : null}

        {result ? (
          <div className="signer-success">
            <h2>Signature submitted</h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : (
          <button
            type="button"
            className="signer-submit"
            onClick={() => void handleSign()}
            disabled={submitting || session.status !== "pending"}
          >
            {submitting ? "Signing..." : "Sign and submit"}
          </button>
        )}
      </section>
    </main>
  );
}
