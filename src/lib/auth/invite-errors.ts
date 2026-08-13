/**
 * Single source of truth for invite failure states.
 * Shared by the server (invite accept route) and the client (landing page),
 * so error codes and copy never drift apart.
 */
export const INVITE_ERROR_CODES = ["missing", "invalid", "used", "expired"] as const;
export type InviteErrorCode = (typeof INVITE_ERROR_CODES)[number];

/** Query param used to surface an invite failure on the landing page. */
export const INVITE_ERROR_PARAM = "invite_error";

/** AppError codes thrown by authService.validateInvite. */
export const INVITE_ERROR_APP_CODES = {
  INVITE_INVALID: "invalid",
  INVITE_USED: "used",
  INVITE_EXPIRED: "expired",
} as const;

export function toInviteErrorCode(value: unknown): InviteErrorCode | null {
  return INVITE_ERROR_CODES.includes(value as InviteErrorCode) ? (value as InviteErrorCode) : null;
}

export const INVITE_ERROR_CONTENT: Record<InviteErrorCode, { title: string; description: string }> = {
  missing: {
    title: "Invitation link incomplete",
    description:
      "This link is missing its invitation token. Ask your administrator to send you the full link again.",
  },
  invalid: {
    title: "Invitation link not recognised",
    description:
      "This invitation doesn't exist or the link was altered. Ask your administrator to generate a new invite.",
  },
  used: {
    title: "Invitation already used",
    description:
      "This invitation was already redeemed and links can only be used once. If the account is yours, sign in instead — otherwise request a new invite.",
  },
  expired: {
    title: "Invitation expired",
    description:
      "Invitations are valid for 7 days. Ask your administrator to generate a fresh invitation link.",
  },
};
