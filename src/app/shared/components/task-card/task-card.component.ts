// src/app/shared/components/task-card/task-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../core/models/task.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent {
  @Input() task!: Task;
  
  get statusClass(): string {
    return `status-${this.task.status}`;
  }
  
  get priorityClass(): string {
    return `priority-${this.task.priority}`;
  }
  
  get priorityLabel(): string {
    switch (this.task.priority) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      case 'urgent': return 'Urgent';
      default: return '';
    }
  }
  
  get isOverdue(): boolean {
    if (!this.task.dueDate) return false;
    return new Date() > this.task.dueDate && this.task.status !== 'done';
  }
  
  get daysUntilDue(): number {
    if (!this.task.dueDate) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(this.task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const timeDiff = dueDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  get dueDateLabel(): string {
    if (!this.task.dueDate) return 'No due date';
    
    const days = this.daysUntilDue;
    
    if (days < 0) {
      return `Overdue by ${Math.abs(days)} days`;
    } else if (days === 0) {
      return 'Due today';
    } else if (days === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${days} days`;
    }
  }
}