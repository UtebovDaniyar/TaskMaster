import { prisma } from "@/lib/prisma";

interface GetMemberProps {
  workspaceId: string;
  userId: string;
}

export const getMember = async ({
  workspaceId,
  userId,
}: GetMemberProps) => {
  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
    },
    include: {
      user: true,
    },
  });

  return member;
};
