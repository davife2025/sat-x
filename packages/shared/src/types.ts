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

export type TeamRole = "owner" | "member";

export interface Team {
  id: string;
  name: string;
  joinCode: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Poll {
  id: string;
  teamId: string;
  question: string;
  createdBy: string;
  createdAt: string;
}

export interface PollOptionResult {
  optionId: string;
  pollId: string;
  label: string;
  position: number;
  voteCount: number;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  // Joined in from profiles for display — optional because not every
  // query needs it.
  displayName?: string | null;
}

export type PostKind = "text" | "image";

export interface Post {
  id: string;
  teamId: string;
  authorId: string;
  parentPostId: string | null;
  kind: PostKind;
  title: string | null;
  body: string | null;
  mediaPath: string | null;
  createdAt: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
