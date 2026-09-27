"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPollAction(teamId: string, formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  const options = formData
    .getAll("option")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!question || options.length < 2) {
    redirect(
      `/teams/${teamId}/polls/new?error=` +
        encodeURIComponent("A question and at least two options are required.")
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_poll", {
    target_team_id: teamId,
    poll_question: question,
    option_labels: options,
  });

  if (error) {
    redirect(`/teams/${teamId}/polls/new?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/teams/${teamId}/polls`);
}

export async function voteAction(teamId: string, pollId: string, optionId: string) {
  const supabase = await createClient();
  await supabase.rpc("cast_vote", {
    target_poll_id: pollId,
    target_option_id: optionId,
  });
  redirect(`/teams/${teamId}/polls`);
}
