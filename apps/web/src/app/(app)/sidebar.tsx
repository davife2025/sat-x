"use client";

import { useState } from "react";
import Link from "next/link";
import { NavIcon } from "@/components/nav-icon";
import { Button } from "@/components/ui/button";

// Only the icons you provided are used here. Where none of the nine
// covers a label (History, Lists, Security), it's a text-only item
// rather than pulling in an icon from anywhere else.
const ITEMS = [
  { href: "/profile", label: "Profile", icon: <NavIcon src="/icons/profile.png" alt="" /> },
  { href: "/history", label: "History", icon: null },
  { href: "/community", label: "Community", icon: <NavIcon src="/icons/community.png" alt="" /> },
  { href: "/lists", label: "Lists", icon: null },
  { href: "/spaces", label: "Space", icon: <NavIcon src="/icons/space.png" alt="" /> },
  { href: "/settings", label: "Settings", icon: <NavIcon src="/icons/settings.png" alt="" /> },
  { href: "/security", label: "Security", icon: null },
];

export function Sidebar({
  isSignedIn,
  email,
  onSignOut,
}: {
  isSignedIn: boolean;
  email?: string;
  onSignOut: () => void;
}) {
  // Starts closed — Home should show the feed first, not the menu.
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-lg"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <aside className="sticky top-0 hidden h-screen w-60 flex-col justify-between border-r border-border px-4 py-6 pt-16 md:flex">
          <div>
            <Link href="/" className="mb-6 block text-2xl font-black">sat-x</Link>
            <nav className="flex flex-col gap-1">
              {isSignedIn &&
                ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-full px-3 py-3 text-lg hover:bg-muted"
                  >
                    {item.icon} {item.label}
                  </Link>
                ))}
            </nav>
            {isSignedIn && (
              <Link href="/compose" className="mt-4 block">
                <Button className="w-full">Post</Button>
              </Link>
            )}
          </div>

          {isSignedIn ? (
            <form action={onSignOut} className="flex items-center justify-between rounded-full px-3 py-2 hover:bg-muted">
              <span className="truncate text-sm">{email}</span>
              <button type="submit" className="ml-2 shrink-0 text-sm font-bold">Sign out</button>
            </form>
          ) : (
            <Link href="/sign-in">
              <Button className="w-full">Sign in</Button>
            </Link>
          )}
        </aside>
      )}

      {open && (
        <aside className="fixed inset-0 z-10 flex flex-col justify-between bg-background px-4 py-6 pt-16 md:hidden">
          <div>
            <nav className="flex flex-col gap-1">
              {isSignedIn &&
                ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-full px-3 py-3 text-lg hover:bg-muted"
                  >
                    {item.icon} {item.label}
                  </Link>
                ))}
            </nav>
            {isSignedIn && (
              <Link href="/compose" className="mt-4 block">
                <Button className="w-full">Post</Button>
              </Link>
            )}
          </div>
          {isSignedIn ? (
            <form action={onSignOut}>
              <Button variant="outline" className="w-full" type="submit">Sign out</Button>
            </form>
          ) : (
            <Link href="/sign-in">
              <Button className="w-full">Sign in</Button>
            </Link>
          )}
        </aside>
      )}
    </>
  );
}
