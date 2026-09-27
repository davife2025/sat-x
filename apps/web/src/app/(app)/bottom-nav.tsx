import Link from "next/link";
import { NavIcon } from "@/components/nav-icon";

// Only the icons you provided — "sat-x AI" has no matching icon among
// them, so it's a text-only item rather than pulling one in from
// elsewhere.
const ITEMS = [
  { href: "/dashboard", label: "Home", icon: <NavIcon src="/icons/home.png" alt="Home" /> },
  { href: "/search", label: "Search", icon: <NavIcon src="/icons/search.png" alt="Search" /> },
  { href: "/ai", label: "sat-x AI", icon: <NavIcon src="/icons/space.png" alt="sat-x AI" /> },
  { href: "/notifications", label: "Notifications", icon: <NavIcon src="/icons/notifications.png" alt="Notifications" /> },
  { href: "/messages", label: "Messages", icon: <NavIcon src="/icons/messages.png" alt="Messages" /> },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-background py-2">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          className="flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-full hover:bg-muted"
        >
          {item.icon ?? <span className="text-[10px] font-bold">AI</span>}
        </Link>
      ))}
    </nav>
  );
}
