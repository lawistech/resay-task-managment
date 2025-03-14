// src/app/core/services/task.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, map, tap } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private supabase: SupabaseClient;
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    // Load tasks when user is authenticated
    this.authService.authState$.subscribe(user => {
      if (user) {
        this.loadTasks();
      } else {
        this.tasksSubject.next([]);
      }
    });
  }

  private async loadTasks(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        project:projects(name)
      `)
      .or(`creator_id.eq.${user.id},assignee_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
      return;
    }

    const tasks = this.transformTasks(data || []);
    this.tasksSubject.next(tasks);
  }

  private transformTasks(data: any[]): Task[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      dueDate: item.due_date ? new Date(item.due_date) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
      assigneeId: item.assignee_id,
      creatorId: item.creator_id,
      projectId: item.project_id,
      estimatedHours: item.estimated_hours,
      tags: item.tags
    }));
  }

  /**
   * Get all tasks for the current user
   */
  public getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  /**
   * Get a task by ID
   * @param taskId The task ID
   */
  public getTask(taskId: string): Observable<Task | null> {
    return from(this.supabase
      .from('tasks')
      .select(`
        *,
        project:projects(name)
      `)
      .eq('id', taskId)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          return null;
        }
        return this.transformTasks([data])[0];
      })
    );
  }

  /**
   * Create a new task
   * @param task The task to create
   */
  public createTask(task: Partial<Task>): Observable<Task> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create tasks');
    }

    const taskData = {
      title: task.title,
      description: task.description,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.dueDate,
      assignee_id: task.assigneeId,
      creator_id: user.id,
      project_id: task.projectId,
      estimated_hours: task.estimatedHours,
      tags: task.tags
    };

    return from(this.supabase
      .from('tasks')
      .insert(taskData)
      .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        const newTask = this.transformTasks(data || [])[0];
        
        // Refresh tasks list
        this.loadTasks();
        
        // Show notification
        this.notificationService.info('Task Created', `Task "${newTask.title}" has been created.`);
        
        return newTask;
      })
    );
  }

  /**
   * Update an existing task
   * @param taskId The task ID
   * @param updates The updates to apply
   */
  public updateTask(taskId: string, updates: Partial<Task>): Observable<Task> {
    const taskData: any = {};
    
    if (updates.title !== undefined) taskData.title = updates.title;
    if (updates.description !== undefined) taskData.description = updates.description;
    if (updates.status !== undefined) taskData.status = updates.status;
    if (updates.priority !== undefined) taskData.priority = updates.priority;
    if (updates.dueDate !== undefined) taskData.due_date = updates.dueDate;
    if (updates.assigneeId !== undefined) taskData.assignee_id = updates.assigneeId;
    if (updates.projectId !== undefined) taskData.project_id = updates.projectId;
    if (updates.estimatedHours !== undefined) taskData.estimated_hours = updates.estimatedHours;
    if (updates.tags !== undefined) taskData.tags = updates.tags;
    
    // Auto set completedAt when status changes to 'done'
    if (updates.status === 'done') {
      taskData.completed_at = new Date();
    } else if (updates.status && updates.status !== 'done') {
      taskData.completed_at = null;
    }

    return from(this.supabase
      .from('tasks')
      .update(taskData)
      .eq('id', taskId)
      .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        const updatedTask = this.transformTasks(data || [])[0];
        
        // Refresh tasks list
        this.loadTasks();
        
        // Show notification
        this.notificationService.success('Task Updated', `Task "${updatedTask.title}" has been updated.`);
        
        return updatedTask;
      })
    );
  }

  /**
   * Delete a task
   * @param taskId The task ID
   */
  public deleteTask(taskId: string): Observable<void> {
    return from(this.supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
        
        // Refresh tasks list
        this.loadTasks();
        
        // Show notification
        this.notificationService.success('Task Deleted', 'Task has been successfully deleted.');
      })
    );
  }

  /**
   * Update task status
   * @param taskId The task ID
   * @param status The new status
   */
  public updateTaskStatus(taskId: string, status: TaskStatus): Observable<Task> {
    return this.updateTask(taskId, { status });
  }

  // Continuing src/app/core/services/task.service.ts
  /**
   * Get tasks by project
   * @param projectId The project ID
   */
  public getTasksByProject(projectId: string): Observable<Task[]> {
    return from(this.supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error loading project tasks:', error);
          return [];
        }
        return this.transformTasks(data || []);
      })
    );
  }

  /**
   * Get tasks assigned to a user
   * @param userId The user ID
   */
  public getTasksByAssignee(userId: string): Observable<Task[]> {
    return from(this.supabase
      .from('tasks')
      .select('*')
      .eq('assignee_id', userId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error loading assigned tasks:', error);
          return [];
        }
        return this.transformTasks(data || []);
      })
    );
  }

  /**
   * Get upcoming tasks (due within the next 7 days)
   */
  public getUpcomingTasks(): Observable<Task[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return from(this.supabase
      .from('tasks')
      .select('*')
      .gte('due_date', today.toISOString())
      .lte('due_date', nextWeek.toISOString())
      .not('status', 'eq', 'done')
      .order('due_date', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error loading upcoming tasks:', error);
          return [];
        }
        return this.transformTasks(data || []);
      })
    );
  }

  /**
   * Get overdue tasks
   */
  public getOverdueTasks(): Observable<Task[]> {
    const today = new Date();
    
    return from(this.supabase
      .from('tasks')
      .select('*')
      .lt('due_date', today.toISOString())
      .not('status', 'eq', 'done')
      .order('due_date', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error loading overdue tasks:', error);
          return [];
        }
        return this.transformTasks(data || []);
      })
    );
  }
}