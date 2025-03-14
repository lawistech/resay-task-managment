import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '../../../core/services/calendar.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-month-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './month-view.component.html',
  styleUrls: ['./month-view.component.scss']
})
export class MonthViewComponent implements OnInit, OnChanges {
  @Input() currentDate: Date = new Date();
  @Input() events: CalendarEvent[] = [];
  
  @Output() dayClick = new EventEmitter<Date>();
  @Output() eventClick = new EventEmitter<CalendarEvent>();
  
  weeks: CalendarDay[][] = [];
  weekdays: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  constructor() {}
  
  ngOnInit(): void {
    this.buildCalendar();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate'] || changes['events']) {
      this.buildCalendar();
    }
  }
  
  buildCalendar(): void {
    this.weeks = [];
    
    // Get the first day of the month
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    
    // Get the day of the week for the first day (0-6, where 0 is Sunday)
    const startingDayOfWeek = firstDay.getDay();
    
    // Get the last day of the month
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Create an array of days for the calendar
    const days: CalendarDay[] = [];
    
    // Add days from the previous month
    const prevMonth = new Date(firstDay);
    prevMonth.setDate(0); // Last day of previous month
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevMonth);
      date.setDate(daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        events: this.getEventsForDay(date)
      });
    }
    
    // Add days from the current month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        events: this.getEventsForDay(date)
      });
    }
    
    // Add days from the next month
    const daysToAdd = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= daysToAdd; i++) {
      const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        events: this.getEventsForDay(date)
      });
    }
    
    // Split days into weeks
    for (let i = 0; i < days.length; i += 7) {
      this.weeks.push(days.slice(i, i + 7));
    }
  }
  
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  getEventsForDay(date: Date): CalendarEvent[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  }
  
  handleDayClick(day: CalendarDay): void {
    this.dayClick.emit(day.date);
  }
  
  handleEventClick(event: CalendarEvent, e: MouseEvent): void {
    e.stopPropagation(); // Prevent triggering day click
    this.eventClick.emit(event);
  }
  
  // Helper function to get event background color with opacity
  getEventBackgroundColor(color: string | undefined): string {
    return color ? `${color}3d` : '#4361ee3d'; // Default blue with 0.15 opacity
  }
  
  // Helper function to get event border color
  getEventBorderColor(color: string | undefined): string {
    return color || '#4361ee'; // Default blue
  }
}