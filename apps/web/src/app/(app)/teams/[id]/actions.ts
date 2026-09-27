"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// RLS (the "owners can update their team" policy) is what actually
// enforces this is owner-only — a non-owner's update just matches zero
// rows and silently does nothing.
export async function setTeamVisibilityAction(
  teamId: string,
  makePublic: boolean
) {
  const supabase = await createClient();
  await supabase.from("teams").update({ is_public: makePublic }).eq("id", teamId);
  redirect(`/teams/${teamId}`);
}
