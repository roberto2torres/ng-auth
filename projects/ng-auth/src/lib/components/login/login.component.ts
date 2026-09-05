import { AfterViewInit, Component, ElementRef, effect, inject, output, viewChild } from '@angular/core';
import { GoogleAuthService } from '../../services/google-auth.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'ngauth-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements AfterViewInit {
  readonly authenticated = output<void>();

  private readonly auth = inject(AuthService);
  private readonly google = inject(GoogleAuthService);
  private readonly buttonRef = viewChild<ElementRef<HTMLDivElement>>('googleButton');

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.authenticated.emit();
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.buttonRef()?.nativeElement;
    if (el) {
      void this.google.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
      });
    }
  }
}
