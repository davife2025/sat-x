import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Card>
        <h1 className="text-xl font-semibold">Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {user.email}. This is the placeholder home base —
          team creation, the live map, and the feed all land in later
          sessions (see BUILD_ROADMAP.md).
        </p>
      </Card>
    </main>
  );
}
