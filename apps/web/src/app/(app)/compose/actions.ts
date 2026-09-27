"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createPostAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const mediaPath = String(formData.get("media_path") ?? "").trim();
  const parentPostId = String(formData.get("parent_post_id") ?? "").trim();

  if (!teamId || (!body && !mediaPath)) {
    redirect(
      "/compose?error=" + encodeURIComponent("Pick a team and write something or attach an image.")
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("posts").insert({
    team_id: teamId,
    title: title || null,
    body: body || null,
    media_path: mediaPath || null,
    parent_post_id: parentPostId || null,
    kind: mediaPath ? "image" : "text",
    author_id: (await supabase.auth.getUser()).data.user?.id,
  });

  if (error) {
    redirect("/compose?error=" + encodeURIComponent(error.message));
  }
  redirect("/dashboard");
}
