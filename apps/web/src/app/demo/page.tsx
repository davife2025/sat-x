import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

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
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-xl font-semibold">Public teams</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Real teams that opted to be publicly viewable — browse read-only,
        no account needed. Sign in to vote or start your own team.
      </p>

      {(!teams || teams.length === 0) && (
        <Card className="mt-6">
          <p className="text-sm text-muted-foreground">
            No public teams yet — be the first: sign in, start a team, and
            flip it to public from the team page.
          </p>
        </Card>
      )}

      <ul className="mt-6 flex flex-col gap-2">
        {teams?.map((t) => (
          <li key={t.id}>
            <a className="text-sm underline" href={`/teams/${t.id}`}>
              {t.name}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
