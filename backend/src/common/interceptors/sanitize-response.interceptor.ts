import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const SENSITIVE_KEYS = new Set(['passwordHash', 'resetToken', 'resetTokenExpiresAt', 'inviteToken']);

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) return value.map((v) => sanitize(v, seen));
  if (value instanceof Date) return value;
  // Prisma Decimal (and anything else with a custom toJSON, e.g. BigInt wrappers)
  // must be left untouched — plain-object recursion strips their prototype and
  // JSON.stringify would otherwise dump raw Decimal.js internals ({s,e,d}).
  if (value && typeof (value as { toJSON?: unknown }).toJSON === 'function') return value;
  if (value && typeof value === 'object') {
    if (seen.has(value)) return value;
    seen.add(value);
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key)) continue;
      out[key] = sanitize(val, seen);
    }
    return out;
  }
  return value;
}

/**
 * Defense-in-depth: strips password hashes and auth tokens from every API
 * response, even if a service forgets a Prisma `select` and includes a full
 * User row via a relation (e.g. SalesInvoice.cashierUser, AuditLog.user).
 * PROJECT_MAP.md §14 "تشفير كلمات المرور" — this is the read-side half of
 * that guarantee: hashes must never leave the server, encrypted or not.
 */
@Injectable()
export class SanitizeResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => sanitize(data)));
  }
}
