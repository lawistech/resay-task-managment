import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss']
})
export class NotificationToastComponent implements OnInit {
  private static instance: NotificationToastComponent;
  private destroy$ = new Subject<void>();
  private timeout: any;
  
  visible = false;
  type: ToastType = 'info';
  title = '';
  message = '';
  duration = 5000; // Default duration in ms
  
  get toastTypeClass(): string {
    return `toast-${this.type}`;
  }
  
  get toastIconClass(): string {
    switch (this.type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': 
      default: return 'fa-info-circle';
    }
  }
  
  constructor() {
    // Singleton pattern to ensure only one toast is shown at a time
    if (NotificationToastComponent.instance) {
      return NotificationToastComponent.instance;
    }
    NotificationToastComponent.instance = this;
  }
  
  ngOnInit(): void {}
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
  
  /**
   * Close the toast
   */
  close(): void {
    this.visible = false;
  }
  
  /**
   * Show a success toast
   * @param title Toast title
   * @param message Toast message
   * @param duration Optional duration in ms
   */
  success(title: string, message: string, duration?: number): void {
    this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }
  
  /**
   * Show an error toast
   * @param title Toast title
   * @param message Toast message
   * @param duration Optional duration in ms
   */
  error(title: string, message: string, duration?: number): void {
    this.show({
      type: 'error',
      title,
      message,
      duration
    });
  }
  
  /**
   * Show a warning toast
   * @param title Toast title
   * @param message Toast message
   * @param duration Optional duration in ms
   */
  warning(title: string, message: string, duration?: number): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }
  
  /**
   * Show an info toast
   * @param title Toast title
   * @param message Toast message
   * @param duration Optional duration in ms
   */
  info(title: string, message: string, duration?: number): void {
    this.show({
      type: 'info',
      title,
      message,
      duration
    });
  }
   * Show a toast notification
   * @param config Toast configuration
   */
  show(config: ToastConfig): void {
    // Clear any existing timeout
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    // Set toast properties
    this.type = config.type;
    this.title = config.title;
    this.message = config.message;
    this.duration = config.duration || 5000;
    
    // Show toast
    this.visible = true;
    
    // Auto-close after duration
    if (this.duration > 0) {
      this.timeout = setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }
  
  /**