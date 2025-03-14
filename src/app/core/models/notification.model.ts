export type NotificationType = 
  'task_assigned' | 
  'task_completed' | 
  'task_due_soon' | 
  'task_comment' | 
  'project_invitation' | 
  'project_update' |
  'system_message';

export type EntityType = 'task' | 'project' | 'comment' | 'file' | 'user' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: any; // Additional structured data
  createdAt: Date;
  entityId?: string; // ID of the related entity (task, project, etc.)
  entityType?: EntityType; // Type of the related entity
}