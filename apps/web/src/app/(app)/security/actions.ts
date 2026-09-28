"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function changePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect("/security?error=" + encodeURIComponent("Use at least 8 characters."));
  }
  if (password !== confirm) {
    redirect("/security?error=" + encodeURIComponent("Those passwords don't match."));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/security?error=" + encodeURIComponent(error.message));
  }

  await supabase.from("profiles").update({ password_changed: true }).eq("id", user.id);
  redirect("/security?saved=1");
}
