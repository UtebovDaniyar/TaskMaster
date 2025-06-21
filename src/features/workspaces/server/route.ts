import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { MemberRole } from "@/features/members/types";
import { TaskStatus } from "@/features/tasks/types";

import { generateInviteCode } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { utapi } from "@/lib/uploadthing";

import { createWorkspaceSchema, updateWorkspaceSchema } from "../schemas";

import { getMember } from "@/features/members/utils";

const app = new Hono()
  .get("/", async (c) => {
    const user = await requireAuth();

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json({ 
      data: { 
        documents: workspaces, 
        total: workspaces.length 
      } 
    });
  })
  .get("/:workspaceId", async (c) => {
    const user = await requireAuth();
    const { workspaceId } = c.req.param();

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!workspace) {
      return c.json({ error: "Workspace not found" }, 404);
    }

    return c.json({ data: workspace });
  })
  .get("/:workspaceId/info", async (c) => {
    const { workspaceId } = c.req.param();

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    });

    if (!workspace) {
      return c.json({ error: "Workspace not found" }, 404);
    }

    return c.json({
      data: {
        id: workspace.id,
        name: workspace.name,
        imageUrl: workspace.imageUrl,
      },
    });
  })
  .post(
    "/",
    zValidator("form", createWorkspaceSchema),
    async (c) => {
      const user = await requireAuth();
      const { name, image } = c.req.valid("form");

      let uploadedImageUrl: string | undefined;

      // Загружаем изображение через UploadThing
      if (image instanceof File) {
        try {
          const response = await utapi.uploadFiles([image]);
          if (response && response[0] && response[0].data?.url) {
            uploadedImageUrl = response[0].data.url;
          } else {
            console.error("Неожиданный ответ от UploadThing:", response);
            return c.json({ error: "Не удалось загрузить изображение" }, 400);
          }
        } catch (error) {
          console.error("Ошибка загрузки изображения:", error);
          return c.json({ error: "Не удалось загрузить изображение" }, 400);
        }
      }

      const workspace = await prisma.workspace.create({
        data: {
          name,
          userId: user.id,
          imageUrl: uploadedImageUrl,
          inviteCode: generateInviteCode(6),
        },
      });

      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: MemberRole.ADMIN,
        },
      });

      return c.json({ data: workspace });
    }
  )
  .patch(
    "/:workspaceId",
    zValidator("form", updateWorkspaceSchema),
    async (c) => {
      const user = await requireAuth();
      const { workspaceId } = c.req.param();
      const { name, image } = c.req.valid("form");

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: user.id,
        },
      });

      if (!member || member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const existingWorkspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!existingWorkspace) {
        return c.json({ error: "Workspace not found" }, 404);
      }

      let uploadedImageUrl: string | undefined;

      // Загружаем новое изображение через UploadThing
      if (image instanceof File) {
        try {
          const response = await utapi.uploadFiles([image]);
          if (response && response[0] && response[0].data?.url) {
            uploadedImageUrl = response[0].data.url;
            
            // Удаляем старое изображение, если оно есть
            if (existingWorkspace.imageUrl) {
              try {
                // Извлекаем file key из UploadThing URL
                const urlParts = existingWorkspace.imageUrl.split('/');
                const fileKey = urlParts[urlParts.length - 1];
                if (fileKey && fileKey.length > 0) {
                  await utapi.deleteFiles([fileKey]);
                }
              } catch (deleteError) {
                console.error("Ошибка удаления старого изображения:", deleteError);
              }
            }
          } else {
            console.error("Неожиданный ответ от UploadThing:", response);
            return c.json({ error: "Не удалось загрузить изображение" }, 400);
          }
        } catch (error) {
          console.error("Ошибка загрузки изображения:", error);
          return c.json({ error: "Не удалось загрузить изображение" }, 400);
        }
      } else {
        uploadedImageUrl = image;
      }

      const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          name,
          imageUrl: uploadedImageUrl,
        },
      });

      return c.json({ data: workspace });
    }
  )
  .delete("/:workspaceId", async (c) => {
    const user = await requireAuth();
    const { workspaceId } = c.req.param();

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const existingWorkspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!existingWorkspace) {
      return c.json({ error: "Workspace not found" }, 404);
    }

    // Удаляем изображение workspace если оно есть
    if (existingWorkspace.imageUrl) {
      try {
        // Извлекаем file key из UploadThing URL
        const urlParts = existingWorkspace.imageUrl.split('/');
        const fileKey = urlParts[urlParts.length - 1];
        if (fileKey && fileKey.length > 0) {
          await utapi.deleteFiles([fileKey]);
        }
      } catch (deleteError) {
        console.error("Ошибка удаления изображения workspace:", deleteError);
      }
    }

    // Cascade delete will handle members, projects, and tasks
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return c.json({ data: { id: workspaceId } });
  })
  .post("/:workspaceId/reset-invite-code", async (c) => {
    const user = await requireAuth();
    const { workspaceId } = c.req.param();

    const member = await getMember({
      workspaceId,
      userId: user.id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workspace = await prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        inviteCode: generateInviteCode(6),
      },
    });

    return c.json({ data: workspace });
  })
  .post(
    "/:workspaceId/join",
    zValidator("json", z.object({
      code: z.string(),
    })),
    async (c) => {
      const user = await requireAuth();
      const { workspaceId } = c.req.param();
      const { code } = c.req.valid("json");

      const workspace = await prisma.workspace.findUnique({
        where: {
          id: workspaceId,
        },
      });

      if (!workspace) {
        return c.json({ error: "Workspace not found" }, 404);
      }

      if (workspace.inviteCode !== code) {
        return c.json({ error: "Invalid invite code" }, 400);
      }

      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: user.id,
        },
      });

      if (existingMember) {
        return c.json({ error: "Already a member" }, 400);
      }

      await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: user.id,
          role: MemberRole.MEMBER,
        },
      });

      return c.json({ data: workspace });
    }
  )
  .get("/:workspaceId/analytics", async (c) => {
    const user = await requireAuth();
    const { workspaceId } = c.req.param();

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthTasks = await prisma.task.count({
      where: {
        workspaceId,
        createdAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
    });

    const lastMonthTasks = await prisma.task.count({
      where: {
        workspaceId,
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const taskCount = thisMonthTasks;
    const taskDifference = taskCount - lastMonthTasks;

    const thisMonthAssignedTasks = await prisma.task.count({
      where: {
        workspaceId,
        assigneeId: user.id,
        createdAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
    });

    const lastMonthAssignedTasks = await prisma.task.count({
      where: {
        workspaceId,
        assigneeId: user.id,
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const assignedTaskCount = thisMonthAssignedTasks;
    const assignedTaskDifference = assignedTaskCount - lastMonthAssignedTasks;

    const thisMonthIncompleteTasks = await prisma.task.count({
      where: {
        workspaceId,
        status: { not: TaskStatus.DONE },
        createdAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
    });

    const lastMonthIncompleteTasks = await prisma.task.count({
      where: {
        workspaceId,
        status: { not: TaskStatus.DONE },
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const incompleteTaskCount = thisMonthIncompleteTasks;
    const incompleteTaskDifference = incompleteTaskCount - lastMonthIncompleteTasks;

    const thisMonthCompletedTasks = await prisma.task.count({
      where: {
        workspaceId,
        status: TaskStatus.DONE,
        createdAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
    });

    const lastMonthCompletedTasks = await prisma.task.count({
      where: {
        workspaceId,
        status: TaskStatus.DONE,
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const completedTaskCount = thisMonthCompletedTasks;
    const completedTaskDifference = completedTaskCount - lastMonthCompletedTasks;

    const thisMonthOverdueTasks = await prisma.task.count({
      where: {
        workspaceId,
        status: { not: TaskStatus.DONE },
        dueDate: { lt: now },
        createdAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
    });

    const lastMonthOverdueTasks = await prisma.task.count({
      where: {
        workspaceId,
        status: { not: TaskStatus.DONE },
        dueDate: { lt: now },
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const overdueTaskCount = thisMonthOverdueTasks;
    const overdueTaskDifference = overdueTaskCount - lastMonthOverdueTasks;

    return c.json({
      data: {
        taskCount,
        taskDifference,
        assignedTaskCount,
        assignedTaskDifference,
        completedTaskCount,
        completedTaskDifference,
        incompleteTaskCount,
        incompleteTaskDifference,
        overdueTaskCount,
        overdueTaskDifference,
      },
    });
  });

export default app;
