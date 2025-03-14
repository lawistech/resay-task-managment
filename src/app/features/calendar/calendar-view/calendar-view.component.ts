import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CalendarService, CalendarEvent } from '../../../core/services/calendar.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MonthViewComponent } from '../month-view/month-view.component';
import { WeekViewComponent } from '../week-view/week-view.component';
import { DayViewComponent } from '../day-view/day-view.component';
import { CalendarEventFormComponent } from '../calendar-event-form/calendar-event-form.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type CalendarView = 'month' | 'week' | 'day';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    MonthViewComponent,
    WeekViewComponent,
    DayViewComponent,
    CalendarEventFormComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnInit, OnDestroy {
  currentView: CalendarView = 'month';
  currentDate: Date = new Date();
  viewTitle: string = '';
  events: CalendarEvent[] = [];
  loading: boolean = true;
  
  // Modal state
  showEventModal: boolean = false;
  selectedEvent: CalendarEvent | null = null;
  selectedDate: Date | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private calendarService: CalendarService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.updateViewTitle();
    this.loadEvents();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadEvents(): void {
    this.loading = true;
    
    // Calculate date range based on current view
    const { startDate, endDate } = this.getDateRange();
    
    this.calendarService.getEventsByDateRange(startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          this.events = events;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading calendar events:', error);
          this.notificationService.error('Error', 'Failed to load calendar events');
          this.loading = false;
        }
      });
  }
  
  getDateRange(): { startDate: Date, endDate: Date } {
    const startDate = new Date(this.currentDate);
    const endDate = new Date(this.currentDate);
    
    if (this.currentView === 'month') {
      // First day of the month
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      // Start from previous month's days that appear in the first week
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      
      // Last day of the month
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
      
      // Include next month's days that appear in the last week
      const lastDayOfWeek = endDate.getDay();
      endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek));
    } else if (this.currentView === 'week') {
      // Start of the week (Sunday)
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      
      // End of the week (Saturday)
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (this.currentView === 'day') {
      // Start of the day
      startDate.setHours(0, 0, 0, 0);
      
      // End of the day
      endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  }
  
  changeView(view: CalendarView): void {
    this.currentView = view;
    this.updateViewTitle();
    this.loadEvents();
  }
  
  navigatePrevious(): void {
    if (this.currentView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else if (this.currentView === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    }
    
    this.currentDate = new Date(this.currentDate);
    this.updateViewTitle();
    this.loadEvents();
  }
  
  navigateNext(): void {
    if (this.currentView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else if (this.currentView === 'day') {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    }
    
    this.currentDate = new Date(this.currentDate);
    this.updateViewTitle();
    this.loadEvents();
  }
  
  navigateToday(): void {
    this.currentDate = new Date();
    this.updateViewTitle();
    this.loadEvents();
  }
  
  updateViewTitle(): void {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric' };
    
    if (this.currentView === 'month') {
      options.month = 'long';
    } else if (this.currentView === 'week') {
      options.month = 'short';
      
      const startOfWeek = new Date(this.currentDate);
      const dayOfWeek = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      // If start and end months are different
      if (startOfWeek.getMonth() !== endOfWeek.getMonth()) {
        const startStr = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        this.viewTitle = `${startStr} - ${endStr}`;
        return;
      }
      
      options.day = 'numeric';
    } else if (this.currentView === 'day') {
      options.month = 'long';
      options.day = 'numeric';
      options.weekday = 'long';
    }
    
    this.viewTitle = this.currentDate.toLocaleDateString('en-US', options);
  }
  
  handleDayClick(date: Date): void {
    this.selectedDate = date;
    this.selectedEvent = null;
    this.showEventModal = true;
  }
  
  handleHourClick(dateTime: Date): void {
    this.selectedDate = dateTime;
    this.selectedEvent = null;
    this.showEventModal = true;
  }
  
  handleEventClick(event: CalendarEvent): void {
    this.selectedEvent = event;
    this.selectedDate = null;
    this.showEventModal = true;
  }
  
  openCreateEventModal(): void {
    this.selectedEvent = null;
    this.selectedDate = new Date();
    this.showEventModal = true;
  }
  
  closeEventModal(): void {
    this.showEventModal = false;
    this.selectedEvent = null;
    this.selectedDate = null;
  }
  
  saveEvent(event: Partial<CalendarEvent>): void {
    if (this.selectedEvent) {
      // Update existing event
      this.calendarService.updateEvent(this.selectedEvent.id, event)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeEventModal();
            this.loadEvents();
          },
          error: (error) => {
            console.error('Error updating event:', error);
            this.notificationService.error('Error', 'Failed to update event');
          }
        });
    } else {
      // Create new event
      this.calendarService.createEvent(event)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeEventModal();
            this.loadEvents();
          },
          error: (error) => {
            console.error('Error creating event:', error);
            this.notificationService.error('Error', 'Failed to create event');
          }
        });
    }
  }
  
  deleteEvent(eventId: string): void {
    this.calendarService.deleteEvent(eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeEventModal();
          this.loadEvents();
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          this.notificationService.error('Error', 'Failed to delete event');
        }
      });
  }
}