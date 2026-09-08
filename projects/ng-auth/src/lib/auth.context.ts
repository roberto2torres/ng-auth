import { HttpContext, HttpContextToken } from '@angular/common/http';

export const SKIP_REFRESH = new HttpContextToken<boolean>(() => false);

export function skipRefreshContext(): HttpContext {
  return new HttpContext().set(SKIP_REFRESH, true);
}
