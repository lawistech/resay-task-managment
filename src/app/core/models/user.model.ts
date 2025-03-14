export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'user' | 'guest';
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    isActive: boolean;
    jobTitle?: string;
    department?: string;
    teamId?: string;
  }