import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AUTH_CONFIG } from '../auth.config';
import { AuthService } from './auth.service';

@Component({ template: '' })
class DummyComponent {}

const AUTH_API = 'https://us-central1-example.cloudfunctions.net';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: DummyComponent },
          { path: '', component: DummyComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AUTH_CONFIG,
          useValue: {
            clientId: 'test-client-id',
            authApiUrl: AUTH_API,
            loginRoute: '/login',
            defaultRoute: '/',
          },
        },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should start unauthenticated and load the user from /auth/me', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getUser()).toBeNull();
    expect(service.initialized()).toBe(false);

    const req = httpMock.expectOne(`${AUTH_API}/auth/me`);
    req.flush({ user: { sub: '123', email: 'jane@example.com' } });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getUser()?.email).toBe('jane@example.com');
    expect(service.initialized()).toBe(true);
  });

  it('should remain unauthenticated when /auth/me returns 401', () => {
    const req = httpMock.expectOne(`${AUTH_API}/auth/me`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(service.isAuthenticated()).toBe(false);
    expect(service.initialized()).toBe(true);
  });

  it('should expose a login method', () => {
    httpMock.expectOne(`${AUTH_API}/auth/me`).flush({ user: { sub: '123' } });
    expect(() => service.login()).not.toThrow();
  });

  it('should logout via /auth/logout and clear the user', () => {
    const meReq = httpMock.expectOne(`${AUTH_API}/auth/me`);
    meReq.flush({ user: { sub: '123' } });

    service.logout();

    const logoutReq = httpMock.expectOne(`${AUTH_API}/auth/logout`);
    logoutReq.flush(null);

    expect(service.isAuthenticated()).toBe(false);
  });

  it('should coalesce concurrent refresh calls into one request', () => {
    const meReq = httpMock.expectOne(`${AUTH_API}/auth/me`);
    meReq.flush(null, { status: 401, statusText: 'Unauthorized' });

    let completed = 0;
    service.refreshToken().subscribe(() => completed++);
    service.refreshToken().subscribe(() => completed++);

    const refreshReq = httpMock.expectOne(`${AUTH_API}/auth/refresh`);
    refreshReq.flush(null);

    expect(completed).toBe(2);
  });
});
