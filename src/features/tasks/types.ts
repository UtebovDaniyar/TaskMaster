import { Task as PrismaTask, TaskStatus, Project, User } from "@prisma/client";

export { TaskStatus };

export type Task = PrismaTask;

// API response types (dates are serialized as strings)
export type TaskApiResponse = Omit<PrismaTask, 'createdAt' | 'updatedAt' | 'dueDate'> & {
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
};

export type TaskWithDetails = PrismaTask & {
  project: Project;
  assignee: User | null;
};

export type TaskWithDetailsApiResponse = TaskApiResponse & {
  project: Omit<Project, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  };
  assignee: (Omit<User, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  }) | null;
};
