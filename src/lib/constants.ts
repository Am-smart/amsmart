/**
 * Shared system constants
 */

export const USER_ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin'
} as const;

export const ASSESSMENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
} as const;

export const SUBMISSION_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    GRADED: 'graded',
    RETURNED: 'returned',
    IN_PROGRESS: 'in progress'
} as const;

export const QUESTION_TYPES = {
    MCQ: 'mcq',
    TF: 'tf',
    SHORT: 'short',
    ESSAY: 'essay',
    FILE: 'file',
    LINK: 'link'
} as const;

export const PLANNER_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
} as const;

export const ANTI_CHEAT = {
    MAX_VIOLATIONS: 5,
    VIOLATION_INTERVAL: 2000,
    TAB_SWITCH_THRESHOLD: 3000,
    RESIZE_THRESHOLD: 160,
    PING_INTERVAL: 5000,
    RESIZE_CHECK_INTERVAL: 2000,
} as const;

export const ANTI_CHEAT_VIOLATIONS = {
    TAB_SWITCH: { label: 'Tab Switch', severity: 4, score: 4, description: 'User switched to another tab' },
    WINDOW_BLUR: { label: 'Window Blur', severity: 3, score: 3, description: 'Window lost focus' },
    MULTIPLE_TABS_DETECTED: { label: 'Multiple Tabs', severity: 5, score: 5, description: 'Multiple assessment tabs detected' },
    RIGHT_CLICK: { label: 'Right Click', severity: 2, score: 2, description: 'Context menu attempt' },
    COPY_ATTEMPT: { label: 'Copy Attempt', severity: 3, score: 3, description: 'Attempted to copy content' },
    PASTE_ATTEMPT: { label: 'Paste Attempt', severity: 3, score: 3, description: 'Attempted to paste content' },
    CUT_ATTEMPT: { label: 'Cut Attempt', severity: 3, score: 3, description: 'Attempted to cut content' },
    DEVTOOLS_ATTEMPT: { label: 'DevTools Shortcut', severity: 5, score: 5, description: 'Attempted to open DevTools via shortcut' },
    CLIPBOARD_SHORTCUT: { label: 'Clipboard Shortcut', severity: 3, score: 3, description: 'Used clipboard keyboard shortcuts' },
    SCREENSHOT_ATTEMPT: { label: 'Screenshot Attempt', severity: 4, score: 4, description: 'Print Screen key detected' },
    DEVTOOLS_OPENED_RESIZE: { label: 'DevTools Resize', severity: 4, score: 4, description: 'Potential DevTools via window resize' },
    DEBUGGER_DETECTED: { label: 'Debugger Detected', severity: 5, score: 5, description: 'Debugger/Tampering detected' },
    SELECTION_ATTEMPT: { label: 'Selection Attempt', severity: 2, score: 2, description: 'Attempted to select text' },
} as const;

export type AntiCheatViolationType = keyof typeof ANTI_CHEAT_VIOLATIONS;

export const SESSION = {
    EXPIRY_DAYS: 7,
    CACHE_EXPIRY_MS: 5 * 60 * 1000,
} as const;

export const ASSESSMENT = {
    DEFAULT_PASSING_SCORE: 60,
} as const;

export const SIGNUP_LIMITS = {
    TEACHER: 3,
    ADMIN: 3
} as const;
