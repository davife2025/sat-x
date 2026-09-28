import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { InviteButton } from "./invite-button";
import { approveRequestAction, dismissRequestAction } from "./actions";

type InviteRequest = {
  request_id: string;
  email: string;
  note: string | null;
  status: "pending" | "approved" | "dismissed";
  created_at: string;
  unredeemed_code: string | null;
};

export default async function AdminPage() {
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
      <main className="mx-auto max-w-xl px-4 py-8">
        <p className="text-sm text-muted-foreground">Admins only.</p>
      </main>
    );
  }

  const { data } = await supabase.rpc("list_invite_requests");
  const requests = (data ?? []) as InviteRequest[];

  return (
    <main className="mx-auto max-w-xl">
      <div className="x-row px-4 py-4">
        <h1 className="text-xl font-black">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An invite code is single-use and becomes the new person's password
          until they change it — so send it privately, and only to them.
        </p>
      </div>

      <div className="x-row px-4 py-4">
        <InviteButton />
      </div>

      <div className="px-4 py-3">
        <h2 className="text-sm font-bold text-muted-foreground">Invite requests</h2>
      </div>
      {requests.length === 0 && (
        <p className="px-4 py-4 text-sm text-muted-foreground">No requests yet.</p>
      )}
      {requests.map((r) => (
        <div key={r.request_id} className="x-row px-4 py-4">
          <p className="font-semibold">{r.email}</p>
          {r.note && <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>}

          {r.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <form action={approveRequestAction.bind(null, r.request_id)}>
                <Button type="submit">Approve &amp; generate code</Button>
              </form>
              <form action={dismissRequestAction.bind(null, r.request_id)}>
                <Button type="submit" variant="outline">Dismiss</Button>
              </form>
            </div>
          )}

          {r.status === "approved" && r.unredeemed_code && (
            <p className="mt-2 text-sm">
              Code: <code className="font-bold">{r.unredeemed_code}</code> — send
              it to {r.email}.
            </p>
          )}
          {r.status === "approved" && !r.unredeemed_code && (
            <p className="mt-2 text-sm text-muted-foreground">Code redeemed — account created.</p>
          )}
          {r.status === "dismissed" && (
            <p className="mt-2 text-sm text-muted-foreground">Dismissed.</p>
          )}
        </div>
      ))}
    </main>
  );
}
