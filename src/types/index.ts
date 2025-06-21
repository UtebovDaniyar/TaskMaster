import { User, Workspace, WorkspaceMember, Project, Task, MemberRole, TaskStatus } from "@prisma/client"

export type { User, Workspace, WorkspaceMember, Project, Task, MemberRole, TaskStatus }

export type WorkspaceWithMembers = Workspace & {
  members: (WorkspaceMember & { user: User })[]
}

export type ProjectWithWorkspace = Project & {
  workspace: Workspace
}

export type TaskWithDetails = Task & {
  project: Project
  assignee: User | null
}

export type MemberWithUser = WorkspaceMember & {
  user: User
} 