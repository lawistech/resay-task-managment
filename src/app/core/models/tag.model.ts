export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    projectId?: string; // If tag is associated with a specific project
  }