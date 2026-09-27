import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setTeamVisibilityAction } from "./actions";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, join_code, is_public")
    .eq("id", id)
    .single();

  if (!team) {
    // Signed-in and no row means genuinely no access — don't confirm or
    // deny it exists. Signed-out is ambiguous (could be private, could be
    // real but you just need to sign in), so prompt instead of a flat 404.
    if (!user) {
      return (
        <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in to see this team.
          </p>
          <a className="mt-2 text-sm underline" href="/sign-in">Sign in</a>
        </main>
      );
    }
    notFound();
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("user_id, role, joined_at, profiles ( display_name )")
    .eq("team_id", id)
    .order("joined_at", { ascending: true });

  const myRole = user ? members?.find((m) => m.user_id === user.id)?.role : undefined;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      {team.is_public && !myRole && (
        <p className="mb-4 text-sm text-muted-foreground">
          You're viewing a public demo team read-only.{" "}
          <a className="underline" href="/sign-in">Sign in</a> to join or
          start your own.
        </p>
      )}
      <Card>
        <h1 className="text-xl font-semibold">{team.name}</h1>
        {myRole === "owner" && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Join code: <code>{team.join_code}</code> — share it with teammates.
            </p>
            <form action={setTeamVisibilityAction.bind(null, id, !team.is_public)} className="mt-2">
              <Button type="submit" variant="outline">
                {team.is_public ? "Make private" : "Make publicly viewable (no sign-in required)"}
              </Button>
            </form>
          </>
        )}

        <h2 className="mt-6 text-sm font-medium text-muted-foreground">Members</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {members?.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between text-sm">
              <span>
                {(m.profiles as unknown as { display_name: string | null } | null)
                  ?.display_name ?? "Unnamed teammate"}
              </span>
              <span className="text-muted-foreground">{m.role}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm">
          <a className="underline" href={`/teams/${id}/polls`}>View polls →</a>
        </p>
      </Card>
    </main>
  );
}
