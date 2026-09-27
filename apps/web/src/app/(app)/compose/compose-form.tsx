"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPostAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function ComposeForm({
  teams,
  error,
}: {
  teams: { id: string; name: string }[];
  error?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (!file) return; // no image — let the plain form action submit normally
    e.preventDefault();
    setUploading(true);
    setUploadError(null);

    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("post-media").upload(path, file);

    setUploading(false);
    if (error) {
      setUploadError(error.message);
      return;
    }

    const form = e.currentTarget;
    (form.elements.namedItem("media_path") as HTMLInputElement).value = path;
    form.requestSubmit();
  }

  return (
    <Card>
      <h1 className="mb-6 text-xl font-black">New post</h1>
      <form action={createPostAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="media_path" />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="team_id">Team</Label>
          <select
            id="team_id"
            name="team_id"
            required
            className="h-12 rounded-md border border-border bg-background px-3 text-base"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title (optional — for a longer, article-style post)</Label>
          <Input id="title" name="title" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="body">What's happening?</Label>
          <textarea
            id="body"
            name="body"
            rows={4}
            className="rounded-md border border-border bg-background p-3 text-base outline-none focus-visible:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="image">Image (optional)</Label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {(error || uploadError) && <p className="text-sm text-red-600">{error ?? uploadError}</p>}
        <Button type="submit" disabled={uploading}>
          {uploading ? "Uploading…" : "Post"}
        </Button>
      </form>
    </Card>
  );
}
