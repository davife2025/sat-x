import { joinTeamAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default async function JoinTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Card>
        <h1 className="mb-6 text-xl font-semibold">Join a team</h1>
        <form action={joinTeamAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Join code</Label>
            <Input id="code" name="code" required placeholder="8-character code" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Join team</Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Starting a new team instead? <a className="underline" href="/teams/new">Create one</a>
        </p>
      </Card>
    </main>
  );
}
