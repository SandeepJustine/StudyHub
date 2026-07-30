// Pass-through layout — the root (school-admin) layout already provides
// the DashboardShell with sidebar, header, and auth guard.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
