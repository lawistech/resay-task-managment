// src/app/shared/pipes/time-ago.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | null | undefined): string {
    if (!value) return '';
    
    const date = value instanceof Date ? value : new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (isNaN(seconds)) {
      return '';
    }
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    let counter;
    
    for (const [key, value] of Object.entries(intervals)) {
      counter = Math.floor(seconds / value);
      
      if (counter > 0) {
        if (counter === 1) {
          return `1 ${key} ago`;
        } else {
          return `${counter} ${key}s ago`;
        }
      }
    }
    
    return 'just now';
  }
}