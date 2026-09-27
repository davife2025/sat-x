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

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Card>
        <h1 className="mb-6 text-xl font-semibold">Start a team</h1>
        <form action={createTeamAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Team name</Label>
            <Input id="name" name="name" required placeholder="e.g. Orbit CubeSat" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Create team</Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have a join code? <a className="underline" href="/teams/join">Join a team</a>
        </p>
      </Card>
    </main>
  );
}
