import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">sat-x</h1>
      <p className="text-muted-foreground">
        A social network for satellite-building teams — coordinate, share
        progress, and find each other in the field. This is the Session 1
        foundation; the real product features start next.
      </p>
      <div className="flex gap-3">
        <Link href="/sign-up">
          <Button>Create an account</Button>
        </Link>
        <Link href="/sign-in">
          <Button variant="outline">Sign in</Button>
        </Link>
      </div>
    </main>
  );
}
