// src/app/features/tasks/task-form/task-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, switchMap } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, TaskStatus, TaskPriority } from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss']
})
export class TaskFormComponent implements OnInit {
  taskForm: FormGroup;
  loading = false;
  saving = false;
  isEditMode = false;
  taskId: string | null = null;
  projects: Project[] = [];
  users: User[] = [];
  
  // Status and priority options
  statuses: { value: TaskStatus, label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'done', label: 'Done' }
  ];
  
  priorities: { value: TaskPriority, label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.taskForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      status: ['todo', Validators.required],
      priority: ['medium', Validators.required],
      dueDate: [null],
      estimatedHours: [null, [Validators.min(0), Validators.max(1000)]],
      projectId: [null],
      assigneeId: [null],
      tags: [''] // Comma-separated tags
    });
  }

  ngOnInit(): void {
    this.loading = true;
    
    // Load projects and users
    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
    });
    
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
    
    // Check if we're in edit mode
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        this.isEditMode = !!id;
        this.taskId = id;
        
        if (this.isEditMode && id) {
          return this.taskService.getTask(id);
        }
        
        return of(null);
      })
    ).subscribe(task => {
      if (task) {
        this.patchFormWithTask(task);
      }
      this.loading = false;
    });
  }
  
  patchFormWithTask(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? this.formatDateForInput(task.dueDate) : null,
      estimatedHours: task.estimatedHours || null,
      projectId: task.projectId || null,
      assigneeId: task.assigneeId || null,
      tags: task.tags ? task.tags.join(', ') : ''
    });
  }
  
  formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }
  
  get formControls() {
    return this.taskForm.controls;
  }
  
  onSubmit(): void {
    if (this.taskForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.formControls).forEach(key => {
        const control = this.taskForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.saving = true;
    
    // Process tags
    const tagsString = this.taskForm.value.tags;
    const tags = tagsString
      ? tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
      : [];
    
    // Prepare task data
    const taskData: Partial<Task> = {
      title: this.taskForm.value.title,
      description: this.taskForm.value.description,
      status: this.taskForm.value.status,
      priority: this.taskForm.value.priority,
      dueDate: this.taskForm.value.dueDate ? new Date(this.taskForm.value.dueDate) : undefined,
      estimatedHours: this.taskForm.value.estimatedHours,
      projectId: this.taskForm.value.projectId,
      assigneeId: this.taskForm.value.assigneeId,
      tags
    };
    
    // Create or update task
    const action: Observable<Task> = this.isEditMode && this.taskId
      ? this.taskService.updateTask(this.taskId, taskData)
      : this.taskService.createTask(taskData);
      
    action.subscribe({
      next: (task) => {
        this.saving = false;
        // Navigate to task detail or back to task list
        this.router.navigate(['/tasks', task.id]);
      },
      error: (error) => {
        console.error('Error saving task:', error);
        this.saving = false;
      }
    });
  }
  
  cancel(): void {
    // Navigate back
    if (this.isEditMode && this.taskId) {
      this.router.navigate(['/tasks', this.taskId]);
    } else {
      this.router.navigate(['/tasks']);
    }
  }
}