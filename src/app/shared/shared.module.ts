import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { FileDropzoneComponent } from './components/file-dropzone/file-dropzone.component';

import { ClickOutsideDirective } from './directives/click-outside.directive';
import { DragDropDirective } from './directives/drag-drop.directive';
import { FileSizeValidatorDirective } from './directives/file-size-validator.directive';

import { FileSizePipe } from './pipes/file-size.pipe';
import { SafeUrlPipe } from './pipes/safe-url.pipe';
import { TaskStatusPipe } from './pipes/task-status.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    
    // Import standalone components
    HeaderComponent,
    SidebarComponent,
    LoadingSpinnerComponent,
    NotificationToastComponent,
    ConfirmationDialogComponent,
    TaskCardComponent,
    FileDropzoneComponent,
    
    // Import standalone directives
    ClickOutsideDirective,
    DragDropDirective,
    FileSizeValidatorDirective,
    
    // Import standalone pipes
    FileSizePipe,
    SafeUrlPipe,
    TaskStatusPipe,
    TimeAgoPipe
  ],
  exports: [
    // Re-export Angular modules
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    
    // Export standalone components
    HeaderComponent,
    SidebarComponent,
    LoadingSpinnerComponent,
    NotificationToastComponent,
    ConfirmationDialogComponent,
    TaskCardComponent,
    FileDropzoneComponent,
    
    // Export standalone directives
    ClickOutsideDirective,
    DragDropDirective,
    FileSizeValidatorDirective,
    
    // Export standalone pipes
    FileSizePipe,
    SafeUrlPipe,
    TaskStatusPipe,
    TimeAgoPipe
  ]
})
export class SharedModule {}