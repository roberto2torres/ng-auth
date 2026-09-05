import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AUTH_CONFIG } from '../auth.config';
import { AuthService } from './auth.service';

@Component({ template: '' })
class DummyComponent {}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: DummyComponent },
          { path: '', component: DummyComponent },
        ]),
        { provide: AUTH_CONFIG, useValue: { clientId: 'test-client-id', loginRoute: '/login', defaultRoute: '/' } },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should start unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getUser()).toBeNull();
    expect(service.getToken()).toBeNull();
  });

  it('should expose a login method', () => {
    expect(() => service.login()).not.toThrow();
  });

  it('should log out cleanly', () => {
    expect(() => service.logout()).not.toThrow();
    expect(service.isAuthenticated()).toBe(false);
  });
});
