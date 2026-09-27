"use client";

import { useState } from "react";
import { createPollAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function NewPollForm({ teamId, error }: { teamId: string; error?: string }) {
  const [optionCount, setOptionCount] = useState(2);

  return (
    <Card>
      <h1 className="mb-6 text-xl font-semibold">New poll</h1>
      <form action={createPollAction.bind(null, teamId)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="question">Question</Label>
          <Input id="question" name="question" required placeholder="Which test site this weekend?" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Options</Label>
          {Array.from({ length: optionCount }).map((_, i) => (
            <Input key={i} name="option" required placeholder={`Option ${i + 1}`} />
          ))}
          {optionCount < 6 && (
            <button
              type="button"
              className="text-left text-sm text-muted-foreground underline"
              onClick={() => setOptionCount((n) => n + 1)}
            >
              + add option
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit">Create poll</Button>
      </form>
    </Card>
  );
}
