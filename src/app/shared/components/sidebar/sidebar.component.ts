import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    // Load saved sidebar state
    const savedState = this.storageService.getItem('sidebar_collapsed');
    if (savedState !== null) {
      this.isCollapsed = savedState === 'true';
    }

    // Check if user is admin
    this.authService.authState$.subscribe(user => {
      this.isAdmin = user?.role === 'admin';
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.storageService.setItem('sidebar_collapsed', this.isCollapsed.toString());
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}