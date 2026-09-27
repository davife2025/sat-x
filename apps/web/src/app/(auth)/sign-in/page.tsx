"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
  const [mode, setMode] = useState<"signin" | "invite">("signin");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // shouldCreateUser: false — sat-x is invite-only, so a brand-new
    // email can't get in through this form; that's what the "I have an
    // invite code" tab is for.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    setLoading(false);
    if (error) {
      setError("No account found for that email — do you have an invite code?");
      return;
    }
    setSent(true);
  }

  async function handleRedeemInvite(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invites/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error?.message ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Could not reach the server — is the API running?");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <p>Check {email} for a sign-in link — no password needed.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Card>
        <div className="mb-6 flex gap-4 border-b border-border text-sm font-bold">
          <button
            className={mode === "signin" ? "border-b-2 border-primary pb-2 text-primary" : "pb-2 text-muted-foreground"}
            onClick={() => { setMode("signin"); setError(null); }}
          >
            Sign in
          </button>
          <button
            className={mode === "invite" ? "border-b-2 border-primary pb-2 text-primary" : "pb-2 text-muted-foreground"}
            onClick={() => { setMode("invite"); setError(null); }}
          >
            I have an invite code
          </button>
        </div>

        {mode === "signin" ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Already have a sat-x account — no password needed.
            </p>
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading}>{loading ? "Sending…" : "Send magic link"}</Button>
            </form>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              sat-x is invite-only right now — ask a teammate for a code.
            </p>
            <form onSubmit={handleRedeemInvite} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-email">Email</Label>
                <Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">Invite code</Label>
                <Input id="code" required value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading}>{loading ? "Checking…" : "Redeem & sign in"}</Button>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
