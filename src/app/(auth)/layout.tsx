/**
 * Auth layout — full-viewport, no chrome. Children render the
 * split-screen auth experience.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
