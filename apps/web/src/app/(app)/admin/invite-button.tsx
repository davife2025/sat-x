"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function InviteButton() {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_invite_code");
    setLoading(false);
    if (error) {
      setError(error.message === "admin_only" ? "Only admins can do this." : error.message);
      return;
    }
    setCode(data as string);
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button variant="outline" onClick={generate} disabled={loading}>
          {loading ? "Generating…" : code ? "Generate another" : "Generate an invite code"}
        </Button>
      </div>
      {code && (
        <p className="text-sm">
          Invite code: <code className="font-bold">{code}</code> — single use.
          It becomes that person's password until they change it.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
