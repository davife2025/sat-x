import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <main className="mx-auto max-w-xl">
      <div className="x-row flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-black">{team.name} — Polls</h1>
        {user ? (
          <a className="text-sm font-bold text-primary" href={`/teams/${id}/polls/new`}>New poll</a>
        ) : (
          <a className="text-sm font-bold text-primary" href="/sign-in">Sign in to vote</a>
        )}
      </div>

      {(!polls || polls.length === 0) && (
        <p className="px-4 py-4 text-sm text-muted-foreground">No polls yet.</p>
      )}

      {polls?.map((poll) => {
        const options = (results ?? [])
          .filter((r) => r.poll_id === poll.id)
          .sort((a, b) => a.position - b.position);
        const total = options.reduce((sum, o) => sum + Number(o.vote_count), 0);
        const myVote = myVoteMap.get(poll.id);

        return (
          <div key={poll.id} className="x-row px-4 py-4">
            <p className="font-semibold">{poll.question}</p>
            <div className="mt-3 flex flex-col gap-2">
              {options.map((opt) => {
                const pct = total > 0 ? Math.round((Number(opt.vote_count) / total) * 100) : 0;
                const mine = myVote === opt.option_id;
                const bar = (
                  <span
                    className="block w-full rounded-2xl border border-border px-3 py-2 text-left text-sm"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary) / 0.15) ${pct}%, transparent ${pct}%)`,
                      fontWeight: mine ? 700 : 400,
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
          </div>
        );
      })}
    </main>
  );
}
