// src/types/index.ts
// Central type exports for the application
// Re-exports all types from database and adds application-specific types

export * from './database';

// ============================================================================
// Application-Specific Types
// ============================================================================

/** User session data */
export interface UserSession {
  id: string;
  email: string;
  role: Role;
  profile?: Profile;
  token: string;
  expiresAt: Date;
}

/** Authentication state */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserSession | null;
  error: string | null;
}

/** Toast notification */
export interface ToastNotification {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
}

/** Table column definition for data tables */
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

/** Sort configuration */
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/** Filter configuration */
export interface FilterConfig {
  key: string;
  value: unknown;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
}

/** Pagination info */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/** Loading state */
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

/** Form state */
export interface FormState<T> extends LoadingState {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

/** HTTP method */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** HTTP headers */
export interface HttpHeaders {
  [key: string]: string;
}

/** HTTP request options */
export interface HttpRequestOptions<T = unknown> {
  method: HttpMethod;
  headers?: HttpHeaders;
  body?: T;
  params?: Record<string, string>;
}

/** HTTP response */
export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: HttpHeaders;
}

// ============================================================================
// Business Domain Types
// ============================================================================

/** Appointment slot availability */
export interface AppointmentSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  vendeuseId: string;
  vendeuseName: string;
}

/** Calendar view configuration */
export interface CalendarConfig {
  view: 'month' | 'week' | 'day';
  date: Date;
  showWeekends: boolean;
  minDate?: Date;
  maxDate?: Date;
}

/** Dashboard widget configuration */
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'list';
  data: unknown;
  position: { x: number; y: number; w: number; h: number };
}

/** User preferences for UI */
export interface UserPreferences {
  theme: Theme;
  language: Langue;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showProfile: boolean;
    showContactInfo: boolean;
  };
}

// ============================================================================
// Event Types
// ============================================================================

/** Custom event types for analytics */
export interface AnalyticsEvent {
  eventName: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

/** Tracking event */
export interface TrackingEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// ============================================================================
// Error Types
// ============================================================================

/** Application error */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Validation error */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400, { fields });
    this.name = 'ValidationError';
  }
}

/** Authentication error */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

/** Authorization error */
export class AuthzError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'AUTHZ_ERROR', 403);
    this.name = 'AuthzError';
  }
}

/** Not found error */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, identifier });
    this.name = 'NotFoundError';
  }
}

/** Rate limit error */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

// ============================================================================
// Result Types (for functional error handling)
// ============================================================================

/** Result type for operations that can succeed or fail */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/** Async result type */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/** Paginated result */
export type PaginatedResult<T> = Result<{
  data: T[];
  pagination: PaginationInfo;
}>;

// ============================================================================
// Utility Functions for Types
// ============================================================================

/** Check if a value is an AppError */
export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && 'code' in error && 'status' in error;
}

/** Check if a value is a ValidationError */
export function isValidationError(error: unknown): error is ValidationError {
  return isAppError(error) && error.code === 'VALIDATION_ERROR';
}

/** Create a success result */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/** Create a failure result */
export function failure<T>(error: Error): Result<T> {
  return { success: false, error };
}

/** Create a validation error result */
export function validationError<T>(fields: Record<string, string[]>): Result<T> {
  return {
    success: false,
    error: new ValidationError('Validation failed', fields),
  };
}
