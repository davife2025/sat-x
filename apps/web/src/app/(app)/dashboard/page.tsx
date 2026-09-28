import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "groups" ? "groups" : "for-you";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, password_changed")
    .eq("id", user.id)
    .single();
  const isAdmin = !!profile?.is_admin;
  const passwordChanged = !!profile?.password_changed;

  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, teams ( id, name )")
    .eq("user_id", user.id);

  const teamIds =
    memberships
      ?.map((m) => (m.teams as unknown as { id: string; name: string } | null)?.id)
      .filter((id): id is string => !!id) ?? [];

  let posts: {
    id: string;
    team_id: string;
    author_id: string;
    title: string | null;
    body: string | null;
    media_path: string | null;
    created_at: string;
  }[] = [];
  let teamNameById = new Map<string, string>();
  let authorNameById = new Map<string, string | null>();

  if (activeTab === "for-you" && teamIds.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select("id, team_id, author_id, title, body, media_path, created_at")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false })
      .limit(50);
    posts = data ?? [];

    teamNameById = new Map(
      memberships
        ?.map((m) => m.teams as unknown as { id: string; name: string } | null)
        .filter((t): t is { id: string; name: string } => !!t)
        .map((t) => [t.id, t.name]) ?? []
    );

    // Same reasoning as the team page fix: no direct FK between posts
    // and profiles, so this is two queries + a merge, not a nested embed.
    const authorIds = [...new Set(posts.map((p) => p.author_id))];
    if (authorIds.length) {
      const { data: authors } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds);
      authorNameById = new Map(authors?.map((a) => [a.id, a.display_name]));
    }
  }

  return (
    <main className="mx-auto max-w-xl">
      {!passwordChanged && (
        <a href="/security" className="x-row block bg-muted px-4 py-3 text-sm">
          Your invite code is still your password.{" "}
          <span className="font-bold text-primary">Change it →</span>
        </a>
      )}
      <div className="sticky top-0 z-10 flex border-b border-border bg-background text-sm font-bold">
        <a
          href="/dashboard?tab=for-you"
          className={`flex-1 py-4 text-center ${activeTab === "for-you" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
        >
          For you
        </a>
        <a
          href="/dashboard?tab=groups"
          className={`flex-1 py-4 text-center ${activeTab === "groups" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
        >
          Groups
        </a>
      </div>

      <Link
        href="/compose"
        aria-label="Create post"
        className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg"
      >
        +
      </Link>

      {activeTab === "groups" ? (
        <>
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-bold text-muted-foreground">Your groups</h2>
            <div className="flex gap-2">
              <a href="/teams/join"><Button variant="outline">Join with code</Button></a>
              {isAdmin && <a href="/teams/new"><Button>Start a group</Button></a>}
            </div>
          </div>
          {memberships && memberships.length > 0 ? (
            memberships.map((m) => {
              const team = m.teams as unknown as { id: string; name: string } | null;
              if (!team) return null;
              return (
                <a key={team.id} href={`/teams/${team.id}`} className="x-row block px-4 py-4 hover:bg-muted">
                  <span className="font-semibold">{team.name}</span>
                </a>
              );
            })
          ) : (
            <p className="px-4 py-4 text-sm text-muted-foreground">You're not on a team yet.</p>
          )}
        </>
      ) : posts.length > 0 ? (
        posts.map((p) => (
          <div key={p.id} className="x-row px-4 py-4">
            <p className="text-xs text-muted-foreground">
              {authorNameById.get(p.author_id) ?? "Unnamed teammate"} · {teamNameById.get(p.team_id) ?? "a team"}
            </p>
            {p.title && <p className="mt-1 font-bold">{p.title}</p>}
            {p.body && <p className="mt-1 whitespace-pre-wrap text-sm">{p.body}</p>}
            {p.media_path && (
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-media/${p.media_path}`}
                alt=""
                className="mt-2 max-h-96 w-full rounded-xl object-cover"
              />
            )}
          </div>
        ))
      ) : (
        <p className="px-4 py-4 text-sm text-muted-foreground">
          No posts yet — be the first on one of your teams.
        </p>
      )}
    </main>
  );
}
