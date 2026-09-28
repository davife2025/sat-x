"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Both RPCs check is_admin themselves — these actions don't need to.
export async function approveRequestAction(requestId: string) {
  const supabase = await createClient();
  await supabase.rpc("approve_invite_request", { target_request: requestId });
  redirect("/admin");
}

export async function dismissRequestAction(requestId: string) {
  const supabase = await createClient();
  await supabase.rpc("dismiss_invite_request", { target_request: requestId });
  redirect("/admin");
}
