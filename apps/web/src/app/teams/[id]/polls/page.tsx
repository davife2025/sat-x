import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { voteAction } from "./actions";

export default async function PollsPage({
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
    .select("id, name")
    .eq("id", id)
    .single();

  if (!team) {
    if (!user) {
      return (
        <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
          <p className="text-sm text-muted-foreground">Sign in to see this team's polls.</p>
          <a className="mt-2 text-sm underline" href="/sign-in">Sign in</a>
        </main>
      );
    }
    notFound();
  }

  const { data: polls } = await supabase
    .from("polls")
    .select("id, question, created_at")
    .eq("team_id", id)
    .order("created_at", { ascending: false });

  const { data: results } = await supabase
    .from("poll_option_results")
    .select("option_id, poll_id, label, position, vote_count");

  const myVotes = user
    ? (await supabase.from("poll_votes").select("poll_id, option_id").eq("user_id", user.id)).data
    : null;
  const myVoteMap = new Map(myVotes?.map((v) => [v.poll_id, v.option_id]));

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{team.name} — Polls</h1>
        {user ? (
          <a className="text-sm underline" href={`/teams/${id}/polls/new`}>New poll</a>
        ) : (
          <a className="text-sm underline" href="/sign-in">Sign in to vote</a>
        )}
      </div>

      {(!polls || polls.length === 0) && (
        <p className="text-sm text-muted-foreground">No polls yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {polls?.map((poll) => {
          const options = (results ?? [])
            .filter((r) => r.poll_id === poll.id)
            .sort((a, b) => a.position - b.position);
          const total = options.reduce((sum, o) => sum + Number(o.vote_count), 0);
          const myVote = myVoteMap.get(poll.id);

          return (
            <Card key={poll.id}>
              <p className="font-medium">{poll.question}</p>
              <div className="mt-3 flex flex-col gap-2">
                {options.map((opt) => {
                  const pct = total > 0 ? Math.round((Number(opt.vote_count) / total) * 100) : 0;
                  const mine = myVote === opt.option_id;
                  const bar = (
                    <span
                      className="block w-full rounded-md border border-border px-3 py-2 text-left text-sm"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--muted)) ${pct}%, transparent ${pct}%)`,
                        fontWeight: mine ? 600 : 400,
                      }}
                    >
                      {opt.label} {mine ? "✓" : ""} — {pct}% ({opt.vote_count})
                    </span>
                  );

                  return user ? (
                    <form key={opt.option_id} action={voteAction.bind(null, id, poll.id, opt.option_id)}>
                      <button type="submit" className="w-full text-left">{bar}</button>
                    </form>
                  ) : (
                    <div key={opt.option_id}>{bar}</div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {total} vote{total === 1 ? "" : "s"}
              </p>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
