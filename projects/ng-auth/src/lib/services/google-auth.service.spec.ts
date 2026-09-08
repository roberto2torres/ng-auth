import { TestBed } from '@angular/core/testing';
import { AUTH_CONFIG } from '../auth.config';
import { GoogleAuthService } from './google-auth.service';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AUTH_CONFIG,
          useValue: {
            clientId: 'test-client-id',
            authApiUrl: 'https://us-central1-example.cloudfunctions.net',
            loginRoute: '/login',
            defaultRoute: '/',
          },
        },
      ],
    });

    service = TestBed.inject(GoogleAuthService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should expose a login method', () => {
    expect(() => service.login()).not.toThrow();
  });

  it('should be a no-op when validating state with no stored state', () => {
    expect(() => service.validateReturningState()).not.toThrow();
  });
});
