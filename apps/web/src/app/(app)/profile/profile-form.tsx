"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfileAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  userId,
  displayName,
  avatarUrl,
}: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (!file) return; // no new photo — plain form submit, display name only
    e.preventDefault();
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);

    setUploading(false);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const form = e.currentTarget;
    (form.elements.namedItem("avatar_url") as HTMLInputElement).value = data.publicUrl;
    form.requestSubmit();
  }

  return (
    <form action={updateProfileAction} onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-4">
      <input type="hidden" name="avatar_url" />
      <div className="flex items-center gap-4">
        <img
          src={preview ?? "/icons/profile.png"}
          alt=""
          className={`h-16 w-16 rounded-full border border-border object-cover ${preview ? "" : "icon-invert p-3"}`}
        />
        <label className="text-sm font-bold text-primary underline cursor-pointer">
          Change photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" defaultValue={displayName} placeholder="What teammates see" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={uploading} className="self-start">
        {uploading ? "Uploading…" : "Save"}
      </Button>
    </form>
  );
}
