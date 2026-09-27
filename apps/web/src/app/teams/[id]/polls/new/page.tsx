import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPollForm } from "./poll-form";

export default async function NewPollPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <NewPollForm teamId={id} error={error} />
    </main>
  );
}
