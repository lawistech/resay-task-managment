import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, map, tap } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public authState$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    // Try to recover session on init
    this.loadUser();

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.currentUserSubject.next(null);
      }
    });
  }

  private async loadUser() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      this.loadUserProfile(session.user.id);
    }
  }

  private async loadUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading user profile:', error);
      return;
    }

    if (data) {
      const user: User = {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        avatarUrl: data.avatar_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastLogin: data.last_login ? new Date(data.last_login) : undefined,
        isActive: data.is_active,
        jobTitle: data.job_title,
        department: data.department,
        teamId: data.team_id
      };
      this.currentUserSubject.next(user);
    }
  }

  public login(email: string, password: string): Observable<any> {
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      tap(response => {
        if (response.error) {
          throw response.error;
        }
      })
    );
  }

  public register(email: string, password: string, firstName: string, lastName: string): Observable<any> {
    return from(this.supabase.auth.signUp({ 
      email, 
      password, 
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    })).pipe(
      tap(response => {
        if (response.error) {
          throw response.error;
        }
      })
    );
  }

  public logout(): Observable<any> {
    return from(this.supabase.auth.signOut()).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
      })
    );
  }

  public forgotPassword(email: string): Observable<any> {
    return from(this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    }));
  }

  public resetPassword(newPassword: string): Observable<any> {
    return from(this.supabase.auth.updateUser({ password: newPassword }));
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  public isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }
}