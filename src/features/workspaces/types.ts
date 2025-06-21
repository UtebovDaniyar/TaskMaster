import { Workspace as PrismaWorkspace, WorkspaceMember, User } from "@prisma/client";

export type Workspace = PrismaWorkspace;

export type WorkspaceWithMembers = PrismaWorkspace & {
  members: (WorkspaceMember & { user: User })[]
};
