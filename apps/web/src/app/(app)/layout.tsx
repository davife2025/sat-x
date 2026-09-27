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

  return (
    <div className="mx-auto flex max-w-5xl">
      <Sidebar isSignedIn={!!user} email={user?.email} onSignOut={signOutAction} />
      <div className="min-h-screen flex-1 pb-16 pt-16">{children}</div>
      <BottomNav />
    </div>
  );
}
