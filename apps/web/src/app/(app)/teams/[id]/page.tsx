import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("user_id, role, joined_at")
    .eq("team_id", id)
    .order("joined_at", { ascending: true });

  // team_members and profiles both reference auth.users separately —
  // there's no direct FK between them, so PostgREST can't embed profiles
  // via a nested select here (that syntax only works across an actual
  // foreign-key relationship). Two queries + a merge instead.
  const userIds = members?.map((m) => m.user_id) ?? [];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const nameById = new Map(profiles?.map((p) => [p.id, p.display_name]));

  const myRole = user ? members?.find((m) => m.user_id === user.id)?.role : undefined;

  return (
    <main className="mx-auto max-w-xl">
      {team.is_public && !myRole && (
        <p className="x-row px-4 py-3 text-sm text-muted-foreground">
          You're viewing a public demo team read-only.{" "}
          <a className="font-semibold text-primary" href="/sign-in">Sign in</a> to
          join or start your own.
        </p>
      )}
      <div className="x-row px-4 py-4">
        <h1 className="text-xl font-black">{team.name}</h1>
        {myRole === "owner" && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Join code: <code>{team.join_code}</code> — share it with teammates.
            </p>
            <form action={setTeamVisibilityAction.bind(null, id, !team.is_public)} className="mt-3">
              <Button type="submit" variant="outline">
                {team.is_public ? "Make private" : "Make publicly viewable"}
              </Button>
            </form>
          </>
        )}
      </div>

      <div className="px-4 py-3">
        <h2 className="text-sm font-bold text-muted-foreground">Members</h2>
      </div>
      {members?.map((m) => (
        <div key={m.user_id} className="x-row flex items-center justify-between px-4 py-3 text-sm">
          <span>{nameById.get(m.user_id) ?? "Unnamed teammate"}</span>
          <span className="text-muted-foreground">{m.role}</span>
        </div>
      ))}

      <a href={`/teams/${id}/polls`} className="block px-4 py-4 text-sm font-semibold text-primary hover:bg-muted">
        View polls →
      </a>
    </main>
  );
}
