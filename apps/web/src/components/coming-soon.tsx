export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <main className="mx-auto max-w-xl">
      <div className="x-row px-4 py-4">
        <h1 className="text-xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {note ?? "Not built yet — this is a placeholder so the nav doesn't dead-end, not a working feature."}
        </p>
      </div>
    </main>
  );
}
