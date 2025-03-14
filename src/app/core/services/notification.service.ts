import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private supabase: SupabaseClient;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private subscription: RealtimeChannel | null = null;

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private authService: AuthService) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    // Listen for auth changes
    this.authService.authState$.subscribe(user => {
      if (user) {
        this.loadNotifications();
        this.setupRealtimeSubscription(user.id);
      } else {
        this.clearNotifications();
        this.unsubscribe();
      }
    });
  }

  private async loadNotifications(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    const notifications = this.transformNotifications(data || []);
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

  private setupRealtimeSubscription(userId: string): void {
    // Unsubscribe existing subscription if any
    this.unsubscribe();

    // Subscribe to notifications table for the current user
    this.subscription = this.supabase
      .channel('public:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleNewNotification(payload.new);
      })
      .subscribe();
  }

  private handleNewNotification(newNotification: any): void {
    const notification = this.transformNotification(newNotification);
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
    
    // Show browser notification if supported
    this.showBrowserNotification(notification);
  }

  private transformNotifications(data: any[]): Notification[] {
    return data.map(item => this.transformNotification(item));
  }

  private transformNotification(item: any): Notification {
    return {
      id: item.id,
      userId: item.user_id,
      type: item.type,
      title: item.title,
      message: item.message,
      read: item.read,
      data: item.data,
      createdAt: new Date(item.created_at),
      entityId: item.entity_id,
      entityType: item.entity_type
    };
  }

  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  private unsubscribe(): void {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }

  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: 'assets/images/logo-icon.svg'
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return;
    }

    const updatedNotifications = this.notificationsSubject.value.map(n => ({
      ...n,
      read: true
    }));

    this.notificationsSubject.next(updatedNotifications);
    this.unreadCountSubject.next(0);
  }

  /**
   * Mark a single notification as read
   * @param notificationId The ID of the notification to mark as read
   */
  public async markAsRead(notificationId?: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // If no ID provided, mark all as read
    if (!notificationId) {
      return this.markAllAsRead();
    }

    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    const updatedNotifications = this.notificationsSubject.value.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );

    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  /**
   * Delete a notification
   * @param notificationId The ID of the notification to delete
   */
  public async deleteNotification(notificationId: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return;
    }

    const updatedNotifications = this.notificationsSubject.value.filter(
      n => n.id !== notificationId
    );

    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  /**
   * Request permission for browser notifications
   * @returns Promise that resolves with the permission status
   */
  public async requestNotificationPermission(): Promise<string> {
    if (!('Notification' in window)) {
      return 'not-supported';
    }

    if (Notification.permission !== 'denied') {
      return Notification.requestPermission();
    }

    return Notification.permission;
  }
}