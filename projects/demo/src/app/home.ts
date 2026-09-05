import { Component, inject } from '@angular/core';
import { AuthService } from 'ng-auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly auth = inject(AuthService);
}
