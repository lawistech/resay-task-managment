// src/app/features/tasks/task-board/task-board.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';

import { TaskService } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';

import { Task, TaskStatus } from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';

import { TaskCardComponent } from '../../../shared/components/task-card/task-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    TaskCardComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss']
})
export class TaskBoardComponent implements OnInit, OnDestroy {
  // Task lists by status
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  reviewTasks: Task[] = [];
  doneTasks: Task[] = [];
  
  // Filters
  projectFilter = new FormControl<string | 'all'>('all');
  assigneeFilter = new FormControl<string | 'all'>('all');
  searchQuery = new FormControl('');
  
  // Data collections
  projects: Project[] = [];
  users: User[] = [];
  currentUser: User | null = null;
  
  // Component state
  loading = true;
  statusUpdating = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Load initial data
    this.loadProjects();
    this.loadUsers();
    this.loadTasks();
    
    // Subscribe to filter changes
    this.projectFilter.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
    
    this.assigneeFilter.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
    
    this.searchQuery.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadTasks(): void {
    this.loading = true;
    
    this.taskService.getTasks().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (tasks) => {
        this.distributeTasks(tasks);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.notificationService.error('Error', 'Failed to load tasks');
        this.loading = false;
      }
    });
  }
  
  loadProjects(): void {
    this.projectService.getProjects().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
      }
    });
  }
  
  loadUsers(): void {
    // Assuming a UserService is available
    // Replace with actual implementation based on your application
    // this.userService.getUsers().pipe(
    //   takeUntil(this.destroy$)
    // ).subscribe(users => {
    //   this.users = users;
    // });
    
    // For now, just use a minimal implementation
    this.users = [];
  }
  
  distributeTasks(tasks: Task[]): void {
    // Reset collections
    this.todoTasks = [];
    this.inProgressTasks = [];
    this.reviewTasks = [];
    this.doneTasks = [];
    
    // Distribute by status
    tasks.forEach(task => {
      switch (task.status) {
        case 'todo':
          this.todoTasks.push(task);
          break;
        case 'in_progress':
          this.inProgressTasks.push(task);
          break;
        case 'review':
          this.reviewTasks.push(task);
          break;
        case 'done':
          this.doneTasks.push(task);
          break;
      }
    });
    
    // Apply any filters
    this.applyFilters();
  }
  
  applyFilters(): void {
    const projectId = this.projectFilter.value;
    const assigneeId = this.assigneeFilter.value;
    const searchText = this.searchQuery.value?.toLowerCase().trim();
    
    // Reload all tasks and filter
    this.taskService.getTasks().pipe(
      takeUntil(this.destroy$)
    ).subscribe(tasks => {
      // Filter tasks
      const filteredTasks = tasks.filter(task => {
        let matchesProject = true;
        let matchesAssignee = true;
        let matchesSearch = true;
        
        // Project filter
        if (projectId && projectId !== 'all') {
          matchesProject = task.projectId === projectId;
        }
        
        // Assignee filter
        if (assigneeId && assigneeId !== 'all') {
          matchesAssignee = task.assigneeId === assigneeId;
        }
        
        // Search filter
        if (searchText) {
          matchesSearch = 
            task.title.toLowerCase().includes(searchText) || 
            (task.description && task.description.toLowerCase().includes(searchText));
        }
        
        return matchesProject && matchesAssignee && matchesSearch;
      });
      
      // Re-distribute filtered tasks
      this.distributeTasks(filteredTasks);
    });
  }
  
  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      // Reordering within the same list
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving to another list - update task status
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = this.getStatusFromContainerId(event.container.id);
      
      // Update in UI immediately for better experience
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update in backend
      this.statusUpdating = true;
      this.taskService.updateTaskStatus(task.id, newStatus).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.statusUpdating = false;
          this.notificationService.success('Status Updated', `Task moved to ${this.getStatusLabel(newStatus)}`);
        },
        error: (error) => {
          console.error('Error updating task status:', error);
          this.notificationService.error('Error', 'Failed to update task status');
          this.statusUpdating = false;
          
          // Revert UI change in case of error
          this.loadTasks();
        }
      });
    }
  }
  
  getStatusFromContainerId(containerId: string): TaskStatus {
    switch (containerId) {
      case 'todoList': return 'todo';
      case 'inProgressList': return 'in_progress';
      case 'reviewList': return 'review';
      case 'doneList': return 'done';
      default: return 'todo';
    }
  }
  
  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'review': return 'In Review';
      case 'done': return 'Done';
      default: return status;
    }
  }
  
  viewTask(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }
  
  createTask(): void {
    this.router.navigate(['/tasks/new']);
  }
  
  clearFilters(): void {
    this.projectFilter.setValue('all');
    this.assigneeFilter.setValue('all');
    this.searchQuery.setValue('');
  }
}