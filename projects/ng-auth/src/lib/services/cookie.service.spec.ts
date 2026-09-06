import { TestBed } from '@angular/core/testing';
import { CookieService } from './cookie.service';

describe('CookieService', () => {
  let service: CookieService;

  beforeEach(() => {
    document.cookie.split(';').forEach((part) => {
      const name = part.split('=')[0].trim();
      if (name) {
        document.cookie = `${name}=; Max-Age=0; Path=/`;
      }
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(CookieService);
  });

  it('should return null for a missing cookie', () => {
    expect(service.get('missing')).toBeNull();
  });

  it('should set and read a cookie', () => {
    service.set('test', 'hello world');
    expect(service.get('test')).toBe('hello world');
  });

  it('should remove a cookie', () => {
    service.set('test', 'value');
    service.remove('test');
    expect(service.get('test')).toBeNull();
  });
});
