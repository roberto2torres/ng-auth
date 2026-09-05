import { TestBed } from '@angular/core/testing';
import { AUTH_CONFIG } from '../auth.config';
import { GoogleAuthService } from './google-auth.service';

function encodePayload(payload: object): string {
  const json = JSON.stringify(payload);
  const base64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${base64}.signature`;
}

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_CONFIG, useValue: { clientId: 'test-client-id', loginRoute: '/login', defaultRoute: '/' } }],
    });

    service = TestBed.inject(GoogleAuthService);
  });

  it('should decode a Google ID token into user info', () => {
    const token = encodePayload({
      sub: '123456789',
      name: 'Jane Doe',
      given_name: 'Jane',
      family_name: 'Doe',
      email: 'jane@example.com',
      email_verified: true,
      picture: 'https://example.com/jane.png',
    });

    const user = service.decodeCredential(token);

    expect(user.sub).toBe('123456789');
    expect(user.name).toBe('Jane Doe');
    expect(user.givenName).toBe('Jane');
    expect(user.familyName).toBe('Doe');
    expect(user.email).toBe('jane@example.com');
    expect(user.emailVerified).toBe(true);
    expect(user.picture).toBe('https://example.com/jane.png');
  });
});
