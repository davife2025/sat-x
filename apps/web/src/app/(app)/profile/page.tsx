import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: myPosts } = await supabase
    .from("posts")
    .select("id, team_id, title, body, media_path, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-xl">
      <div className="x-row px-4 py-4">
        <h1 className="text-xl font-black">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <ProfileForm
        userId={user.id}
        displayName={profile?.display_name ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <div className="x-row px-4 py-3">
        <h2 className="text-sm font-bold text-muted-foreground">Your posts</h2>
      </div>
      {myPosts && myPosts.length > 0 ? (
        myPosts.map((p) => (
          <div key={p.id} className="x-row px-4 py-4">
            {p.title && <p className="font-bold">{p.title}</p>}
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
        <p className="px-4 py-4 text-sm text-muted-foreground">You haven't posted yet.</p>
      )}
    </main>
  );
}
