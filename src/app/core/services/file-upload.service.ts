import { Injectable } from '@angular/core';
import { Observable, from, of, switchMap, throwError } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Attachment } from '../models/attachment.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private supabase: SupabaseClient;
  private readonly storageUrl: string;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
    this.storageUrl = environment.storageUrl;
  }

  /**
   * Upload a file to Supabase Storage
   * @param file The file to upload
   * @param entityType The type of entity the file is attached to
   * @param entityId The ID of the entity
   * @param bucketName Optional custom bucket name (defaults to 'attachments')
   */
  uploadFile(
    file: File,
    entityType: 'task' | 'comment' | 'project',
    entityId: string,
    bucketName: string = 'attachments'
  ): Observable<Attachment> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User must be authenticated to upload files'));
    }

    // Create a unique file path
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${entityType}/${entityId}/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Upload file to Supabase Storage
    return from(this.supabase.storage.from(bucketName).upload(filePath, file)).pipe(
      switchMap(uploadResult => {
        if (uploadResult.error) {
          this.notificationService.error('Upload Failed', uploadResult.error.message);
          return throwError(() => uploadResult.error);
        }

        // Get public URL for the file
        const fileUrl = `${this.storageUrl}/object/public/${bucketName}/${filePath}`;
        
        // Create record in attachments table
        const attachment: Partial<Attachment> = {
          filename: filePath,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          url: fileUrl,
          storageKey: filePath,
          uploaderId: user.id,
          entityId: entityId,
          entityType: entityType
        };

        return from(this.supabase.from('attachments').insert(attachment).select()).pipe(
          switchMap(dbResult => {
            if (dbResult.error) {
              // If database insert fails, try to delete the uploaded file
              this.supabase.storage.from(bucketName).remove([filePath]);
              this.notificationService.error('Upload Failed', dbResult.error.message);
              return throwError(() => dbResult.error);
            }

            const createdAttachment = dbResult.data[0] as Attachment;
            this.notificationService.success('Upload Complete', `${file.name} uploaded successfully`);
            return of(createdAttachment);
          })
        );
      })
    );
  }

  /**
   * Get a list of attachments for an entity
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   */
  getAttachments(entityType: 'task' | 'comment' | 'project', entityId: string): Observable<Attachment[]> {
    return from(this.supabase
      .from('attachments')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
    ).pipe(
      switchMap(result => {
        if (result.error) {
          return throwError(() => result.error);
        }
        return of(result.data as Attachment[]);
      })
    );
  }

  /**
   * Delete an attachment
   * @param attachment The attachment to delete
   * @param bucketName Optional custom bucket name (defaults to 'attachments')
   */
  deleteAttachment(attachment: Attachment, bucketName: string = 'attachments'): Observable<void> {
    // Delete from storage
    return from(this.supabase.storage.from(bucketName).remove([attachment.storageKey])).pipe(
      switchMap(storageResult => {
        if (storageResult.error) {
          this.notificationService.error('Delete Failed', storageResult.error.message);
          return throwError(() => storageResult.error);
        }

        // Delete from database
        return from(this.supabase.from('attachments').delete().eq('id', attachment.id)).pipe(
          switchMap(dbResult => {
            if (dbResult.error) {
              this.notificationService.error('Delete Failed', dbResult.error.message);
              return throwError(() => dbResult.error);
            }
            
            this.notificationService.success('File Deleted', `${attachment.originalName} deleted successfully`);
            return of(undefined);
          })
        );
      })
    );
  }

  /**
   * Generate a thumbnail URL for an image
   * @param attachment The attachment to generate a thumbnail for
   * @param width The thumbnail width
   * @param height The thumbnail height
   */
  getThumbnailUrl(attachment: Attachment, width: number = 200, height: number = 200): string {
    // Check if it's an image
    if (!attachment.mimeType.startsWith('image/')) {
      return '';
    }

    // Supabase transformation parameters
    const transformParams = `width=${width}&height=${height}&resize=contain`;
    return `${this.storageUrl}/render/image/public/${attachment.storageKey}?${transformParams}`;
  }
}