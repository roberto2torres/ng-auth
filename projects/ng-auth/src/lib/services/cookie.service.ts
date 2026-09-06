import { Injectable, PLATFORM_ID, REQUEST, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CookieSetOptions {
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
  maxAge?: number;
}

interface CookieOptions {
  name: string;
  path: string;
  sameSite: 'Lax' | 'Strict' | 'None';
  secure: boolean;
  maxAge?: number;
}

function parseCookie(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) {
      continue;
    }
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}

function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path}`);
  parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) {
    parts.push('Secure');
  }
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  return parts.join('; ');
}

@Injectable({ providedIn: 'root' })
export class CookieService {
  private readonly request = inject(REQUEST);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  get(name: string): string | null {
    if (this.isBrowser) {
      return parseCookie(document.cookie)[name] ?? null;
    }
    const header = this.request?.headers.get('cookie');
    return header ? (parseCookie(header)[name] ?? null) : null;
  }

  set(name: string, value: string, options?: CookieSetOptions): void {
    if (!this.isBrowser) {
      return;
    }
    document.cookie = serializeCookie(name, value, {
      name,
      path: options?.path ?? '/',
      sameSite: options?.sameSite ?? 'Lax',
      secure: options?.secure ?? false,
      maxAge: options?.maxAge,
    });
  }

  remove(name: string, options?: CookieSetOptions): void {
    this.set(name, '', { ...options, maxAge: 0 });
  }
}
