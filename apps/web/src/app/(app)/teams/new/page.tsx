import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTeamAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default async function NewTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Only admins can create a group right now. Ask an admin to start
          one and share its join code with you instead.
        </p>
        <a className="mt-2 text-sm underline" href="/teams/join">Join with a code</a>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Card>
        <h1 className="mb-6 text-xl font-semibold">Start a group</h1>
        <form action={createTeamAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Group name</Label>
            <Input id="name" name="name" required placeholder="e.g. Orbit CubeSat" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Create group</Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have a join code? <a className="underline" href="/teams/join">Join a group</a>
        </p>
      </Card>
    </main>
  );
}
