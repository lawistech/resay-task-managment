// src/app/features/tasks/task-attachments/task-attachments.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Attachment } from '../../../core/models/attachment.model';
import { FileDropzoneComponent } from '../../../shared/components/file-dropzone/file-dropzone.component';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';

@Component({
  selector: 'app-task-attachments',
  standalone: true,
  imports: [
    CommonModule,
    FileDropzoneComponent,
    FileSizePipe,
    TimeAgoPipe,
    SafeUrlPipe
  ],
  templateUrl: './task-attachments.component.html',
  styleUrls: ['./task-attachments.component.scss']
})
export class TaskAttachmentsComponent implements OnInit, OnDestroy {
  @Input() taskId!: string;
  
  attachments: Attachment[] = [];
  isUploading = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private fileUploadService: FileUploadService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAttachments();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadAttachments(): void {
    if (!this.taskId) return;
    
    this.fileUploadService.getAttachments('task', this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attachments) => {
          this.attachments = attachments;
        },
        error: (error) => {
          console.error('Error loading attachments:', error);
          this.notificationService.error('Error', 'Failed to load attachments');
        }
      });
  }
  
  handleFileUpload(files: FileList): void {
    if (!this.taskId) return;
    
    this.isUploading = true;
    
    const file = files[0];
    this.fileUploadService.uploadFile(file, 'task', this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attachment) => {
          this.attachments.unshift(attachment);
          this.isUploading = false;
        },
        error: (error) => {
          console.error('Error uploading file:', error);
          this.notificationService.error('Error', 'Failed to upload file');
          this.isUploading = false;
        }
      });
  }
  
  deleteAttachment(attachment: Attachment): void {
    this.fileUploadService.deleteAttachment(attachment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.attachments = this.attachments.filter(a => a.id !== attachment.id);
        },
        error: (error) => {
          console.error('Error deleting attachment:', error);
          this.notificationService.error('Error', 'Failed to delete attachment');
        }
      });
  }
  
  downloadAttachment(attachment: Attachment): void {
    window.open(attachment.url, '_blank');
  }
  
  getIconClass(mimeType: string): string {
    if (mimeType.includes('image')) return 'fa-file-image';
    if (mimeType.includes('pdf')) return 'fa-file-pdf';
    if (mimeType.includes('word')) return 'fa-file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fa-file-excel';
    return 'fa-file';
  }
}