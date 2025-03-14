// src/app/features/tasks/task-detail/task-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import { Attachment } from '../../../core/models/attachment.model';
import { Comment } from '../../../core/models/comment.model';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TaskStatusPipe } from '../../../shared/pipes/task-status.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { FileSizePipe } from '../../../shared/pipes/file-size.pipe';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { FileDropzoneComponent } from '../../../shared/components/file-dropzone/file-dropzone.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CommentService } from '../../../core/services/comment.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    TaskStatusPipe,
    TimeAgoPipe,
    FileSizePipe,
    SafeUrlPipe,
    FileDropzoneComponent,
    ConfirmationDialogComponent
  ],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  task: Task | null = null;
  loading = true;
  saving = false;
  statusUpdating = false;
  showDeleteConfirmation = false;
  currentUser: User | null = null;
  assignee: User | null = null;
  creator: User | null = null;
  attachments: Attachment[] = [];
  comments: Comment[] = [];
  commentContent = new FormControl('');
  isUploadingFile = false;
  
  // Statuses for dropdown
  statuses: { value: TaskStatus, label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'done', label: 'Done' }
  ];
  
  // Priorities for display
  priorities: { value: TaskPriority, label: string, color: string }[] = [
    { value: 'low', label: 'Low', color: '#4caf50' },
    { value: 'medium', label: 'Medium', color: '#2196f3' },
    { value: 'high', label: 'High', color: '#ff9800' },
    { value: 'urgent', label: 'Urgent', color: '#f44336' }
  ];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private userService: UserService,
    private fileUploadService: FileUploadService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private commentService: CommentService,

  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const taskId = params.get('id');
      if (taskId) {
        this.loadTask(taskId);
      } else {
        this.router.navigate(['/tasks']);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadTask(taskId: string): void {
    this.loading = true;
    
    this.taskService.getTask(taskId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (task) => {
        this.task = task;
        
        // Load additional data
        if (task) {
          this.loadAssignee(task.assigneeId);
          this.loadCreator(task.creatorId);
          this.loadAttachments(task.id);
          this.loadComments(task.id);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.notificationService.error('Error', 'Failed to load task details');
        this.loading = false;
        this.router.navigate(['/tasks']);
      }
    });
  }
  
  loadAssignee(assigneeId?: string): void {
    if (!assigneeId) {
      this.assignee = null;
      return;
    }
    
    this.userService.getUser(assigneeId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.assignee = user;
    });
  }
  
  loadCreator(creatorId: string): void {
    this.userService.getUser(creatorId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.creator = user;
    });
  }
  
  loadAttachments(taskId: string): void {
    this.fileUploadService.getAttachments('task', taskId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
      },
      error: (error) => {
        console.error('Error loading attachments:', error);
      }
    });
  }
  
  loadComments(taskId: string): void {
    // Assume you have a comment service
    // this.commentService.getCommentsByEntity('task', taskId).subscribe(comments => {
    //   this.comments = comments;
    // });
    
    // For now, using placeholder until you implement a comment service
    this.comments = [];
  }
  
  updateStatus(status: TaskStatus): void {
    if (!this.task || this.statusUpdating || this.task.status === status) {
      return;
    }
    
    this.statusUpdating = true;
    
    this.taskService.updateTaskStatus(this.task.id, status).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedTask) => {
        this.task = updatedTask;
        this.statusUpdating = false;
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.notificationService.error('Error', 'Failed to update task status');
        this.statusUpdating = false;
      }
    });
  }
  
  editTask(): void {
    if (this.task) {
      this.router.navigate(['/tasks/edit', this.task.id]);
    }
  }
  
  confirmDelete(): void {
    this.showDeleteConfirmation = true;
  }
  
  cancelDelete(): void {
    this.showDeleteConfirmation = false;
  }
  
  deleteTask(): void {
    if (!this.task) return;
    
    this.saving = true;
    
    this.taskService.deleteTask(this.task.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.saving = false;
        this.showDeleteConfirmation = false;
        this.router.navigate(['/tasks']);
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.notificationService.error('Error', 'Failed to delete task');
        this.saving = false;
        this.showDeleteConfirmation = false;
      }
    });
  }
  
  addComment(): void {
    if (!this.task || !this.commentContent.value?.trim()) return;
    
    // Implement comment adding when you have a comment service
    // this.commentService.addComment({
    //   content: this.commentContent.value,
    //   entityId: this.task.id,
    //   entityType: 'task'
    // }).subscribe({
    //   next: (comment) => {
    //     this.comments.unshift(comment);
    //     this.commentContent.reset();
    //   },
    //   error: (error) => {
    //     console.error('Error adding comment:', error);
    //     this.notificationService.error('Error', 'Failed to add comment');
    //   }
    // });
    
    // For now, just show a notification
    this.notificationService.info('Comment Feature', 'Comments will be implemented soon');
    this.commentContent.reset();
  }
  
  handleFileUpload(files: FileList): void {
    if (!this.task) return;
    
    this.isUploadingFile = true;
    
    const file = files[0];
    this.fileUploadService.uploadFile(file, 'task', this.task.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (attachment) => {
        this.attachments.unshift(attachment);
        this.isUploadingFile = false;
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        this.notificationService.error('Error', 'Failed to upload file');
        this.isUploadingFile = false;
      }
    });
  }
  
  deleteAttachment(attachment: Attachment): void {
    this.fileUploadService.deleteAttachment(attachment).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
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
  
  // Gets priority color based on the task's priority
  getPriorityColor(): string {
    if (!this.task) return '';
    const priority = this.priorities.find(p => p.value === this.task?.priority);
    return priority?.color || '';
  }
  
  // Check if the task is overdue
  get isOverdue(): boolean {
    if (!this.task?.dueDate) return false;
    return new Date() > new Date(this.task.dueDate) && this.task.status !== 'done';
  }
  
  // Format the due date for display
  getDueDateDisplay(): string {
    if (!this.task?.dueDate) return 'No due date';
    
    const dueDate = new Date(this.task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  }

  loadComments(taskId: string): void {
    this.commentService.getCommentsByEntity('task', taskId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
      }
    });
  }
  
  // Replace the addComment method with this implementation
  addComment(): void {
    if (!this.task || !this.commentContent.value?.trim()) return;
    
    this.commentService.addComment({
      content: this.commentContent.value,
      entityId: this.task.id,
      entityType: 'task'
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.commentContent.reset();
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.notificationService.error('Error', 'Failed to add comment');
      }
    });
}
}