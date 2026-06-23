export const ERROR_CODES = {
  UNAUTHORIZED_CLINIC: 'UNAUTHORIZED_CLINIC',
  PATIENT_ROUTING_FAILED: 'PATIENT_ROUTING_FAILED',
  NO_SESSION: 'NO_SESSION',
  INVALID_LINK: 'INVALID_LINK',
  LINK_EXPIRED: 'LINK_EXPIRED',
} as const;

export const AUTH_ERRORS = {
  [ERROR_CODES.UNAUTHORIZED_CLINIC]: {
    title: "Access Denied",
    message: "You do not work at this clinic.",
  },
  [ERROR_CODES.PATIENT_ROUTING_FAILED]: {
    title: "Record Not Found",
    message: "We could not find your patient records. Please contact support.",
  },
  [ERROR_CODES.NO_SESSION]: {
    title: "Session Expired",
    message: "Your session has expired. Please log in again.",
  },
  [ERROR_CODES.INVALID_LINK]: {
    title: "Invalid Link",
    message: "This link has expired or is invalid. Please request a new one.",
  },
  [ERROR_CODES.LINK_EXPIRED]: {
    title: "Link Expired",
    message: "This link has expired or was already used. Request a new one below.",
  },
  DEFAULT: {
    title: "Authentication Error",
    message: "An unexpected error occurred. Please try again.",
  }
} as const;

export type AuthErrorCode = keyof typeof ERROR_CODES;