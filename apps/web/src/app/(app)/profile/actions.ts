"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const update: { display_name: string | null; avatar_url?: string } = {
    display_name: displayName || null,
  };
  if (avatarUrl) update.avatar_url = avatarUrl;

  await supabase.from("profiles").update(update).eq("id", user.id);

  redirect("/profile");
}
