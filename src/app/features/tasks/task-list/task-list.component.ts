// src/app/features/tasks/task-list/task-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TaskCardComponent } from '../../../shared/components/task-card/task-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TaskStatusPipe } from '../../../shared/pipes/task-status.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    TaskCardComponent,
    LoadingSpinnerComponent,
    TaskStatusPipe,
    TimeAgoPipe
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  loading = true;
  statusFilter = new FormControl<TaskStatus | 'all'>('all');
  priorityFilter = new FormControl<TaskPriority | 'all'>('all');
  searchQuery = new FormControl('');
  currentUser: User | null = null;
  viewMode = 'list'; // 'list' or 'board'

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTasks();
    
    // Subscribe to filter changes
    this.statusFilter.valueChanges.subscribe(() => this.applyFilters());
    this.priorityFilter.valueChanges.subscribe(() => this.applyFilters());
    this.searchQuery.valueChanges.subscribe(() => this.applyFilters());
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.tasks];
    
    // Apply status filter
    if (this.statusFilter.value && this.statusFilter.value !== 'all') {
      result = result.filter(task => task.status === this.statusFilter.value);
    }
    
    // Apply priority filter
    if (this.priorityFilter.value && this.priorityFilter.value !== 'all') {
      result = result.filter(task => task.priority === this.priorityFilter.value);
    }
    
    // Apply search query
    const query = this.searchQuery.value?.toLowerCase().trim();
    if (query) {
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) || 
        (task.description && task.description.toLowerCase().includes(query))
      );
    }
    
    this.filteredTasks = result;
  }

  createTask(): void {
    this.router.navigate(['/tasks/new']);
  }

  viewTask(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'board' : 'list';
  }

  clearFilters(): void {
    this.statusFilter.setValue('all');
    this.priorityFilter.setValue('all');
    this.searchQuery.setValue('');
  }
}