import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export const getWorkspaces = async () => {
  const user = await requireAuth();

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    documents: workspaces,
    total: workspaces.length,
  };
};
