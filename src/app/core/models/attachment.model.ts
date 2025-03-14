export interface Attachment {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    url: string;
    storageKey: string; // Supabase storage key
    thumbnailUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    uploaderId: string;
    entityId: string; // ID of the entity this attachment belongs to (task, comment, project)
    entityType: 'task' | 'comment' | 'project'; // Type of the entity
  }