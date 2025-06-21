import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { TaskStatus } from "@/features/tasks/types";
import { getMember } from "@/features/members/utils";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { utapi } from "@/lib/uploadthing";

import { createProjectSchema, updateProjectSchema } from "../schemas";

const app = new Hono()
  .post(
    "/",
    zValidator("form", createProjectSchema),
    async (c) => {
      const user = await requireAuth();
      const { name, image, workspaceId } = c.req.valid("form");

      const member = await getMember({
        workspaceId,
        userId: user.id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

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

      const project = await prisma.project.create({
        data: {
          name,
          imageUrl: uploadedImageUrl,
          workspaceId,
          userId: user.id,
        },
      });

      return c.json({ data: project });
    }
  )
  .get(
    "/",
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = await requireAuth();
      const { workspaceId } = c.req.valid("query");

      if (!workspaceId) {
        return c.json({ error: "Missing workspaceId" }, 400);
      }

      const member = await getMember({
        workspaceId,
        userId: user.id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projects = await prisma.project.findMany({
        where: { workspaceId },
        include: {
          workspace: true,
          creator: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return c.json({ 
        data: { 
          documents: projects, 
          total: projects.length 
        } 
      });
    }
  )
  .get("/:projectId", async (c) => {
    const user = await requireAuth();
    const { projectId } = c.req.param();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: true,
        creator: true,
      },
    });

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    const member = await getMember({
      workspaceId: project.workspaceId,
      userId: user.id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({ data: project });
  })
  .patch(
    "/:projectId",
    zValidator("form", updateProjectSchema),
    async (c) => {
      const user = await requireAuth();
      const { projectId } = c.req.param();
      const { name, image } = c.req.valid("form");

      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!existingProject) {
        return c.json({ error: "Project not found" }, 404);
      }

      const member = await getMember({
        workspaceId: existingProject.workspaceId,
        userId: user.id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let uploadedImageUrl: string | undefined;

      // Загружаем новое изображение через UploadThing
      if (image instanceof File) {
        try {
          const response = await utapi.uploadFiles([image]);
          if (response && response[0] && response[0].data?.url) {
            uploadedImageUrl = response[0].data.url;
            
            // Удаляем старое изображение, если оно есть
            if (existingProject.imageUrl) {
              try {
                // Извлекаем file key из UploadThing URL
                const urlParts = existingProject.imageUrl.split('/');
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

      const project = await prisma.project.update({
        where: { id: projectId },
        data: {
          name,
          imageUrl: uploadedImageUrl,
        },
      });

      return c.json({ data: project });
    }
  )
  .delete("/:projectId", async (c) => {
    const user = await requireAuth();
    const { projectId } = c.req.param();

    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return c.json({ error: "Project not found" }, 404);
    }

    const member = await getMember({
      workspaceId: existingProject.workspaceId,
      userId: user.id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Удаляем изображение проекта если оно есть
    if (existingProject.imageUrl) {
      try {
        // Извлекаем file key из UploadThing URL
        const urlParts = existingProject.imageUrl.split('/');
        const fileKey = urlParts[urlParts.length - 1];
        if (fileKey && fileKey.length > 0) {
          await utapi.deleteFiles([fileKey]);
        }
      } catch (deleteError) {
        console.error("Ошибка удаления изображения проекта:", deleteError);
      }
    }

    // Cascade delete will handle tasks
    await prisma.project.delete({
      where: { id: projectId },
    });

    return c.json({ data: { $id: existingProject.id } });
  })
  .get("/:projectId/analytics", async (c) => {
    const user = await requireAuth();
    const { projectId } = c.req.param();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    const member = await getMember({
      workspaceId: project.workspaceId,
      userId: user.id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthTasks = await prisma.task.findMany({
      where: {
        projectId,
        createdAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
    });

    const lastMonthTasks = await prisma.task.findMany({
      where: {
        projectId,
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const taskCount = thisMonthTasks.length;
    const taskDifference = taskCount - lastMonthTasks.length;

    const thisMonthAssignedTasks = thisMonthTasks.filter(
      (task) => task.assigneeId === user.id
    );
    const lastMonthAssignedTasks = lastMonthTasks.filter(
      (task) => task.assigneeId === user.id
    );

    const assignedTaskCount = thisMonthAssignedTasks.length;
    const assignedTaskDifference = assignedTaskCount - lastMonthAssignedTasks.length;

    const thisMonthIncompleteTasks = thisMonthTasks.filter(
      (task) => task.status !== TaskStatus.DONE
    );
    const lastMonthIncompleteTasks = lastMonthTasks.filter(
      (task) => task.status !== TaskStatus.DONE
    );

    const incompleteTaskCount = thisMonthIncompleteTasks.length;
    const incompleteTaskDifference = incompleteTaskCount - lastMonthIncompleteTasks.length;

    const thisMonthCompletedTasks = thisMonthTasks.filter(
      (task) => task.status === TaskStatus.DONE
    );
    const lastMonthCompletedTasks = lastMonthTasks.filter(
      (task) => task.status === TaskStatus.DONE
    );

    const completedTaskCount = thisMonthCompletedTasks.length;
    const completedTaskDifference = completedTaskCount - lastMonthCompletedTasks.length;

    const thisMonthOverdueTasks = thisMonthTasks.filter(
      (task) => {
        return task.dueDate && task.dueDate < now && task.status !== TaskStatus.DONE;
      }
    );
    const lastMonthOverdueTasks = lastMonthTasks.filter(
      (task) => {
        return task.dueDate && task.dueDate < lastMonthEnd && task.status !== TaskStatus.DONE;
      }
    );

    const overdueTaskCount = thisMonthOverdueTasks.length;
    const overdueTaskDifference = overdueTaskCount - lastMonthOverdueTasks.length;

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
