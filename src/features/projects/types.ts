import { Project as PrismaProject, Workspace, User } from "@prisma/client";

export type Project = PrismaProject;

// API response types (dates are serialized as strings)
export type ProjectApiResponse = Omit<PrismaProject, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type ProjectWithWorkspace = PrismaProject & {
  workspace: Workspace;
  creator: User;
};
