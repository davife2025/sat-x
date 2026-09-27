export function NavIcon({ src, alt }: { src: string; alt: string }) {
  // Inline width/height as well as the className — this way the icon is
  // correctly sized even in an environment where, for whatever reason,
  // globals.css didn't load (which is what "icons are huge" looks like:
  // the raw 128x128 source file rendering unconstrained).
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className="nav-icon"
      width={22}
      height={22}
      style={{ width: 22, height: 22, display: "block" }}
    />
  );
}
