/**
 * Theme-agnostic types only. Domain types (teams, locations, posts, feed
 * ranking, etc.) get added in the sessions that build those features —
 * see BUILD_ROADMAP.md. Keeping this file infra-only avoids Session 1
 * baking in assumptions the product sessions haven't made yet.
 */

export interface Profile {
  id: string; // matches auth.users.id in Supabase
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
