import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "./actions";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, is_admin")
      .eq("id", user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = !!profile?.is_admin;
  }

  return (
    <div className="mx-auto flex max-w-5xl">
      <Sidebar isSignedIn={!!user} email={user?.email} avatarUrl={avatarUrl} isAdmin={isAdmin} onSignOut={signOutAction} />
      <div className="min-h-screen flex-1 pb-16 pt-16">{children}</div>
      <BottomNav />
    </div>
  );
}
