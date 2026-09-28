"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "request">("signin");
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState(""); // invite code OR password
  const [showSecret, setShowSecret] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  async function post(path: string, payload: unknown) {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const cleanEmail = email.trim().toLowerCase();

    // 1) Normal case: an existing account, secret is its password.
    const first = await supabase.auth.signInWithPassword({ email: cleanEmail, password: secret });
    if (!first.error) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // 2) Otherwise this may be a brand-new person entering an invite
    // code. Redeeming creates the account with the code as its password,
    // then we sign in with those same values.
    try {
      const body = await post("/invites/redeem", { email: cleanEmail, code: secret });
      if (body.ok) {
        const second = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: secret.trim().toLowerCase(),
        });
        if (!second.error) {
          router.push("/dashboard");
          router.refresh();
          return;
        }
        setError(second.error.message);
      } else if (body.error?.error === "account_exists") {
        setError("Incorrect password.");
      } else if (body.error?.error === "create_failed") {
        setError(body.error.message);
      } else {
        setError("Incorrect password, or that invite code isn't valid.");
      }
    } catch {
      setError("Could not reach the server — try again in a moment.");
    }
    setLoading(false);
  }

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = await post("/invites/request", { email, note });
      if (body.ok) setRequested(true);
      else setError(body.error?.message ?? "Something went wrong.");
    } catch {
      setError("Could not reach the server — try again in a moment.");
    }
    setLoading(false);
  }

  if (requested) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <p>Request sent. An admin will send an invite code to {email} if approved.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Card>
        <div className="mb-6 flex gap-4 border-b border-border text-sm font-bold">
          <button
            type="button"
            className={mode === "signin" ? "border-b-2 border-primary pb-2 text-primary" : "pb-2 text-muted-foreground"}
            onClick={() => { setMode("signin"); setError(null); }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "request" ? "border-b-2 border-primary pb-2 text-primary" : "pb-2 text-muted-foreground"}
            onClick={() => { setMode("request"); setError(null); }}
          >
            Request an invite
          </button>
        </div>

        {mode === "signin" ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              First time? Enter your invite code — it becomes your password,
              and you can change it later in Security.
            </p>
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="secret">Invite code or password</Label>
                  <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setShowSecret((v) => !v)}>
                    {showSecret ? "Hide" : "Show"}
                  </button>
                </div>
                <Input
                  id="secret"
                  type={showSecret ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading}>{loading ? "Signing in…" : "Continue"}</Button>
            </form>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              No code yet? Ask for one — an admin reviews requests and sends
              codes out.
            </p>
            <form onSubmit={handleRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="req-email">Email</Label>
                <Input id="req-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note">Which team are you with? (optional)</Label>
                <Input id="note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading}>{loading ? "Sending…" : "Request an invite"}</Button>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
