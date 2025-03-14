export interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    entityId: string; // ID of the entity this comment belongs to (task, project)
    entityType: 'task' | 'project'; // Type of the entity
    parentId?: string; // For threaded comments
    attachments?: string[]; // IDs of attached files
    mentions?: string[]; // IDs of mentioned users
  }