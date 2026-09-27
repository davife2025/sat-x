import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-5xl font-black tracking-tight">sat-x</h1>
      <p className="text-muted-foreground">
        A social network for satellite-building teams — coordinate, share
        progress, and find each other in the field. Invite-only for now.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/sign-in">
          <Button>Get started</Button>
        </Link>
        <Link href="/demo">
          <Button variant="outline">See it without an account</Button>
        </Link>
      </div>
    </main>
  );
}
