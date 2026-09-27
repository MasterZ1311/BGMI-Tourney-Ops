import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiErrorDetail {
  field?: string;
  message: string;
  rule?: string;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | Record<string, unknown> | any[];
    timestamp: string;
    path?: string;
  };
}

export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number;
    message?: string;
    meta?: {
      total?: number;
      page?: number;
      limit?: number;
    };
  }
): NextResponse<ApiSuccessEnvelope<T>> {
  const envelope: ApiSuccessEnvelope<T> = {
    success: true,
    data,
    ...(options?.message ? { message: options.message } : {}),
    ...(options?.meta
      ? {
          meta: {
            ...options.meta,
            timestamp: new Date().toISOString(),
          },
        }
      : {}),
  };

  return NextResponse.json(envelope, { status: options?.status ?? 200 });
}

export function apiError(
  message: string,
  options?: {
    status?: number;
    code?: string;
    details?: ApiErrorDetail[] | Record<string, unknown> | any[];
    path?: string;
  }
): NextResponse<ApiErrorEnvelope> {
  const status = options?.status ?? 400;
  let defaultCode = 'BAD_REQUEST';

  if (status === 404) defaultCode = 'NOT_FOUND';
  else if (status === 409) defaultCode = 'CONFLICT';
  else if (status === 401) defaultCode = 'UNAUTHORIZED';
  else if (status === 403) defaultCode = 'FORBIDDEN';
  else if (status === 422) defaultCode = 'VALIDATION_ERROR';
  else if (status >= 500) defaultCode = 'INTERNAL_SERVER_ERROR';

  const envelope: ApiErrorEnvelope = {
    success: false,
    error: {
      code: options?.code || defaultCode,
      message,
      ...(options?.details !== undefined ? { details: options.details } : {}),
      timestamp: new Date().toISOString(),
      ...(options?.path ? { path: options.path } : {}),
    },
  };

  return NextResponse.json(envelope, { status });
}

export function handleRouteError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  path?: string
): NextResponse<ApiErrorEnvelope> {
  if (error instanceof ZodError) {
    const details: ApiErrorDetail[] = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      rule: err.code,
    }));

    return apiError(error.errors[0]?.message || 'Input validation failed', {
      status: 422,
      code: 'VALIDATION_ERROR',
      details,
      path,
    });
  }

  const err = error as any;
  const message = err?.message || defaultMessage;
  const status = typeof err?.status === 'number' ? err.status : 500;
  const code = err?.code || (status === 404 ? 'NOT_FOUND' : status === 409 ? 'CONFLICT' : 'INTERNAL_SERVER_ERROR');

  return apiError(message, {
    status,
    code,
    details: err?.details,
    path,
  });
}
