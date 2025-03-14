import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, map, of, switchMap } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  projectId?: string;
  taskId?: string;
  attendees?: string[]; // User IDs
  reminderMinutes?: number;
  recurring?: boolean;
  recurrencePattern?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private supabase: SupabaseClient;
  private eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  public events$ = this.eventsSubject.asObservable();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    this.authService.authState$.subscribe(user => {
      if (user) {
        this.loadEvents();
      } else {
        this.eventsSubject.next([]);
      }
    });
  }

  private async loadEvents(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const { data, error } = await this.supabase
      .from('calendar_events')
      .select('*')
      .or(`creator_id.eq.${user.id},attendees.cs.{${user.id}}`)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error loading calendar events:', error);
      return;
    }

    const events = this.transformEvents(data || []);
    this.eventsSubject.next(events);
  }

  private transformEvents(data: any[]): CalendarEvent[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      startTime: new Date(item.start_time),
      endTime: new Date(item.end_time),
      allDay: item.all_day,
      location: item.location,
      color: item.color,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      creatorId: item.creator_id,
      projectId: item.project_id,
      taskId: item.task_id,
      attendees: item.attendees,
      reminderMinutes: item.reminder_minutes,
      recurring: item.recurring,
      recurrencePattern: item.recurrence_pattern
    }));
  }

  /**
   * Get all calendar events for the current user
   */
  getEvents(): Observable<CalendarEvent[]> {
    return this.events$;
  }

  /**
   * Get calendar events for a date range
   * @param startDate Range start date
   * @param endDate Range end date
   */
  getEventsByDateRange(startDate: Date, endDate: Date): Observable<CalendarEvent[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return of([]);
    }

    return from(this.supabase
      .from('calendar_events')
      .select('*')
      .or(`creator_id.eq.${user.id},attendees.cs.{${user.id}}`)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('start_time', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error loading calendar events by date range:', error);
          return [];
        }
        return this.transformEvents(data || []);
      })
    );
  }

  /**
   * Get a single calendar event by ID
   * @param eventId The event ID
   */
  getEvent(eventId: string): Observable<CalendarEvent | null> {
    return from(this.supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          return null;
        }
        return this.transformEvents([data])[0];
      })
    );
  }

  /**
   * Create a new calendar event
   * @param event The event to create
   */
  createEvent(event: Partial<CalendarEvent>): Observable<CalendarEvent> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return of(null as unknown as CalendarEvent);
    }

    const eventData = {
      title: event.title,
      description: event.description,
      start_time: event.startTime,
      end_time: event.endTime,
      all_day: event.allDay || false,
      location: event.location,
      color: event.color,
      creator_id: user.id,
      project_id: event.projectId,
      task_id: event.taskId,
      attendees: event.attendees || [],
      reminder_minutes: event.reminderMinutes,
      recurring: event.recurring || false,
      recurrence_pattern: event.recurrencePattern
    };

    return from(this.supabase
      .from('calendar_events')
      .insert(eventData)
      .select()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          this.notificationService.error('Event Creation Failed', error.message);
          throw error;
        }
        
        const newEvent = this.transformEvents(data || [])[0];
        
        // Refresh events list
        this.loadEvents();
        
        this.notificationService.success('Event Created', `Event "${newEvent.title}" has been created.`);
        return of(newEvent);
      })
    );
  }

  /**
   * Update an existing calendar event
   * @param eventId The event ID
   * @param updates The updates to apply
   */
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Observable<CalendarEvent> {
    const eventData: any = {};
    
    if (updates.title !== undefined) eventData.title = updates.title;
    if (updates.description !== undefined) eventData.description = updates.description;
    if (updates.startTime !== undefined) eventData.start_time = updates.startTime;
    if (updates.endTime !== undefined) eventData.end_time = updates.endTime;
    if (updates.allDay !== undefined) eventData.all_day = updates.allDay;
    if (updates.location !== undefined) eventData.location = updates.location;
    if (updates.color !== undefined) eventData.color = updates.color;
    if (updates.projectId !== undefined) eventData.project_id = updates.projectId;
    if (updates.taskId !== undefined) eventData.task_id = updates.taskId;
    if (updates.attendees !== undefined) eventData.attendees = updates.attendees;
    if (updates.reminderMinutes !== undefined) eventData.reminder_minutes = updates.reminderMinutes;
    if (updates.recurring !== undefined) eventData.recurring = updates.recurring;
    if (updates.recurrencePattern !== undefined) eventData.recurrence_pattern = updates.recurrencePattern;

    return from(this.supabase
      .from('calendar_events')
      .update(eventData)
      .eq('id', eventId)
      .select()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          this.notificationService.error('Event Update Failed', error.message);
          throw error;
        }
        
        const updatedEvent = this.transformEvents(data || [])[0];
        
        // Refresh events list
        this.loadEvents();
        
        this.notificationService.success('Event Updated', `Event "${updatedEvent.title}" has been updated.`);
        return of(updatedEvent);
      })
    );
  }

  /**
   * Delete a calendar event
   * @param eventId The event ID
   */
  deleteEvent(eventId: string): Observable<void> {
    return from(this.supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.notificationService.error('Event Deletion Failed', error.message);
          throw error;
        }
        
        // Refresh events list
        this.loadEvents();
        
        this.notificationService.success('Event Deleted', 'Event has been successfully deleted.');
      })
    );
  }

  /**
   * Get events for a specific project
   * @param projectId The project ID
   */
  getEventsByProject(projectId: string): Observable<CalendarEvent[]> {
    return from(this.supabase
      .from('calendar_events')
      .select('*')
      .eq('project_id', projectId)
      .order('start_time', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error loading project events:', error);
          return [];
        }
        return this.transformEvents(data || []);
      })
    );
  }

  /**
   * Get events related to a specific task
   * @param taskId The task ID
   */
  getEventsByTask(taskId: string): Observable<CalendarEvent[]> {
    return from(this.supabase
      .from('calendar_events')
      .select('*')
      .eq('task_id', taskId)
      .order('start_time', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error loading task events:', error);
          return [];
        }
        return this.transformEvents(data || []);
      })
    );
  }
}