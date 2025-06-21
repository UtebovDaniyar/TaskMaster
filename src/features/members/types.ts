import { WorkspaceMember, MemberRole, User } from "@prisma/client";

export { MemberRole };

export type Member = WorkspaceMember;

export type MemberWithUser = WorkspaceMember & {
  user: User;
};
