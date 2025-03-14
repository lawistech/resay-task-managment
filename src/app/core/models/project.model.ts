export interface Project {
    id: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    creatorId: string;
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    progress: number; // 0-100 percentage
    color?: string; // For UI representation
    members: string[]; // User IDs
    budget?: number;
    actualCost?: number;
  }