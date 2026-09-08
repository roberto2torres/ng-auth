import { Component, effect, inject, output } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'ngauth-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  readonly authenticated = output<void>();

  readonly auth = inject(AuthService);

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.authenticated.emit();
      }
    });
  }
}
