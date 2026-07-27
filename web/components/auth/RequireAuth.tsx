// Login is disabled for now — this is a straight pass-through instead of
// redirecting to /login when no token is present. The API's requireAuth
// middleware has a matching fallback (server/src/middleware/auth.js), so the
// app works without signing in. To re-enable, restore the getToken() /
// router.replace("/login") check that was here before.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
