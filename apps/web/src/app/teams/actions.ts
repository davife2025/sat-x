"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server actions redirect on both paths (success -> the team page, failure
// -> back to the form with ?error=...) rather than returning state, so the
// forms don't need a client-side action-state hook.

export async function createTeamAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/teams/new?error=" + encodeURIComponent("Team name is required."));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_team", {
    team_name: name,
  });

  if (error || !data) {
    redirect("/teams/new?error=" + encodeURIComponent(error?.message ?? "Could not create the team."));
  }
  redirect(`/teams/${data.id}`);
}

export async function joinTeamAction(formData: FormData) {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toLowerCase();
  if (!code) redirect("/teams/join?error=" + encodeURIComponent("Join code is required."));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_team", { code });

  if (error || !data) {
    redirect("/teams/join?error=" + encodeURIComponent("That join code didn't match a team."));
  }
  redirect(`/teams/${data.id}`);
}
