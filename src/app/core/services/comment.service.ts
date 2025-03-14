// src/app/core/services/comment.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Comment } from '../models/comment.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private supabase: SupabaseClient;
  
  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }
  
  /**
   * Get comments for a specific entity
   * @param entityType The entity type ('task' or 'project')
   * @param entityId The entity ID
   */
  getCommentsByEntity(entityType: 'task' | 'project', entityId: string): Observable<Comment[]> {
    return from(this.supabase
      .from('comments')
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error loading comments:', error);
          return [];
        }
        return this.transformComments(data || []);
      })
    );
  }
  
  /**
   * Add a new comment
   * @param comment The comment data to add
   */
  addComment(comment: Partial<Comment>): Observable<Comment> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User must be authenticated to add comments'));
    }
    
    const commentData = {
      content: comment.content,
      entity_id: comment.entityId,
      entity_type: comment.entityType,
      author_id: user.id,
      parent_id: comment.parentId,
      mentions: comment.mentions || [],
      attachments: comment.attachments || []
    };
    
    return from(this.supabase
      .from('comments')
      .insert(commentData)
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          this.notificationService.error('Comment Failed', error.message);
          return throwError(() => error);
        }
        
        const newComment = this.transformComments(data || [])[0];
        return of(newComment);
      })
    );
  }
  
  /**
   * Update a comment
   * @param commentId The comment ID
   * @param content The updated content
   */
  updateComment(commentId: string, content: string): Observable<Comment> {
    return from(this.supabase
      .from('comments')
      .update({ content })
      .eq('id', commentId)
      .select(`
        *,
        author:profiles(id, first_name, last_name, avatar_url)
      `)
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          this.notificationService.error('Update Failed', error.message);
          return throwError(() => error);
        }
        
        const updatedComment = this.transformComments(data || [])[0];
        return of(updatedComment);
      })
    );
  }
  
  /**
   * Delete a comment
   * @param commentId The comment ID
   */
  deleteComment(commentId: string): Observable<void> {
    return from(this.supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.notificationService.error('Delete Failed', error.message);
          throw error;
        }
      })
    );
  }
  
  /**
   * Transform the raw comments data from Supabase
   * @param data The raw comments data
   */
  private transformComments(data: any[]): Comment[] {
    return data.map(item => ({
      id: item.id,
      content: item.content,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      authorId: item.author_id,
      entityId: item.entity_id,
      entityType: item.entity_type,
      parentId: item.parent_id,
      attachments: item.attachments || [],
      mentions: item.mentions || [],
      author: item.author ? {
        id: item.author.id,
        firstName: item.author.first_name,
        lastName: item.author.last_name,
        avatarUrl: item.author.avatar_url
      } : undefined
    }));
  }
}