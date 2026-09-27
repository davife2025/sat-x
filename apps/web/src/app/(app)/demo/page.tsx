import { createClient } from "@/lib/supabase/server";

export default async function DemoPage() {
  // Deliberately doesn't check for a signed-in user — that's the whole
  // point of this route. Visibility is enforced by RLS (is_public = true
  // is readable by the anon role), not by application logic here.
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-xl">
      <div className="x-row px-4 py-4">
        <h1 className="text-xl font-black">Public teams</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real teams that opted to be publicly viewable — browse read-only,
          no account needed. Sign in to vote or start your own team.
        </p>
      </div>

      {(!teams || teams.length === 0) && (
        <p className="px-4 py-4 text-sm text-muted-foreground">
          No public teams yet — be the first: sign in, start a team, and
          flip it to public from the team page.
        </p>
      )}

      {teams?.map((t) => (
        <a key={t.id} href={`/teams/${t.id}`} className="x-row block px-4 py-4 text-sm font-semibold hover:bg-muted">
          {t.name}
        </a>
      ))}
    </main>
  );
}
