"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function InviteButton() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("create_invite_code");
    setLoading(false);
    if (data) setCode(data as string);
  }

  if (code) {
    return (
      <p className="text-sm">
        Invite code: <code className="font-bold">{code}</code> — share it,
        good for one signup.
      </p>
    );
  }

  return (
    <Button variant="outline" onClick={generate} disabled={loading}>
      {loading ? "Generating…" : "Invite a teammate"}
    </Button>
  );
}
