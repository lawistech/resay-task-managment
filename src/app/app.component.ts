import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    LoadingSpinnerComponent,
    NotificationToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'lawis-task-manager';
  isLoggedIn = false;
  loading = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.authState$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.loading = false;
    });
  }
}