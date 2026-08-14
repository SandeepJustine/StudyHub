// Pass-through layout — the root public layout already provides
// the navigation, footer, and brand styling.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
