import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { changePasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto max-w-xl">
      <div className="x-row px-4 py-4">
        <h1 className="text-xl font-black">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          If you signed up with an invite code, that code is still your
          password until you change it here.
        </p>
      </div>
      <form action={changePasswordAction} className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-primary">Password updated.</p>}
        <Button type="submit" className="self-start">Change password</Button>
      </form>
    </main>
  );
}
