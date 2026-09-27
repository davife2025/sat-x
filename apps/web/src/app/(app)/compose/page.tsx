import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ComposeForm } from "./compose-form";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: memberships } = await supabase
    .from("team_members")
    .select("teams ( id, name )")
    .eq("user_id", user.id);

  const teams =
    memberships
      ?.map((m) => m.teams as unknown as { id: string; name: string } | null)
      .filter((t): t is { id: string; name: string } => t !== null) ?? [];

  if (teams.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          You need to be on a team before you can post.
        </p>
        <a className="mt-2 text-sm underline" href="/teams/new">Start a team</a>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <ComposeForm teams={teams} error={error} />
    </main>
  );
}
