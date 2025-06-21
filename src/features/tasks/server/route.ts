import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

import { TaskStatus } from "../types";
import { createTaskSchema } from "../schemas";

const app = new Hono()
  .delete("/:taskId", async (c) => {
    const user = await requireAuth();
    const { taskId } = c.req.param();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    const member = await getMember({
      workspaceId: task.workspaceId,
      userId: user.id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return c.json({ data: { $id: task.id } });
  })
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.nativeEnum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish(),
      })
    ),
    async (c) => {
      const user = await requireAuth();
      const { workspaceId, projectId, status, search, assigneeId, dueDate } =
        c.req.valid("query");

      const member = await getMember({
        workspaceId,
        userId: user.id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const where: {
        workspaceId: string;
        projectId?: string;
        status?: TaskStatus;
        assigneeId?: string;
        dueDate?: Date;
        name?: {
          contains: string;
          mode: "insensitive";
        };
      } = {
        workspaceId,
      };

      if (projectId) {
        where.projectId = projectId;
      }

      if (status) {
        where.status = status;
      }

      if (assigneeId) {
        where.assigneeId = assigneeId;
      }

      if (dueDate) {
        where.dueDate = new Date(dueDate);
      }

      if (search) {
        where.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          project: true,
          assignee: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const populatedTasks = tasks.map((task) => ({
        ...task,
        project: task.project,
        assignee: task.assignee ? {
          ...task.assignee,
          name: task.assignee.name || task.assignee.email,
          email: task.assignee.email,
        } : null,
      }));

      return c.json({
        data: {
          documents: populatedTasks,
          total: populatedTasks.length,
        },
      });
    }
  )
  .post(
    "/",
    zValidator("json", createTaskSchema),
    async (c) => {
      try {
        const user = await requireAuth();
        
        const { name, status, workspaceId, projectId, dueDate, assigneeId, description } = c.req.valid("json");

        const member = await getMember({
          workspaceId,
          userId: user.id,
        });

        if (!member) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        // Проверяем существование исполнителя если он указан
        if (assigneeId && assigneeId !== "" && assigneeId !== "undefined") {
          const assigneeMember = await getMember({
            workspaceId,
            userId: assigneeId,
          });

          if (!assigneeMember) {
            return c.json({ error: "Assignee not found in workspace" }, 400);
          }
        }
      const highestPositionTask = await prisma.task.findFirst({
        where: {
          status,
          workspaceId,
        },
        orderBy: {
          position: "desc",
        },
      });

      const newPosition = highestPositionTask
        ? highestPositionTask.position + 1000
        : 1000;

      const task = await prisma.task.create({
        data: {
          name,
          status,
          workspaceId,
          projectId,
          dueDate: dueDate ? new Date(dueDate) : null,
          assigneeId: assigneeId && assigneeId !== "" && assigneeId !== "undefined" ? assigneeId : null,
          description: description || null,
          position: newPosition,
        },
      });

      return c.json({ data: task });
      } catch (error) {
        console.error("❌ Error creating task:", error);
        return c.json({ error: "Failed to create task" }, 500);
      }
    }
  )
  .patch(
    "/:taskId",
    zValidator("json", createTaskSchema.partial()),
    async (c) => {
      const user = await requireAuth();
      const { name, status, description, projectId, dueDate, assigneeId } =
        c.req.valid("json");
      const { taskId } = c.req.param();

      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!existingTask) {
        return c.json({ error: "Task not found" }, 404);
      }

      const member = await getMember({
        workspaceId: existingTask.workspaceId,
        userId: user.id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

              // Проверяем существование исполнителя если он указан
        if (assigneeId && assigneeId !== "" && assigneeId !== "undefined") {
          const assigneeMember = await getMember({
            workspaceId: existingTask.workspaceId,
            userId: assigneeId,
          });

          if (!assigneeMember) {
            return c.json({ error: "Assignee not found in workspace" }, 400);
          }
        }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          name,
          status,
          projectId,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          assigneeId: assigneeId && assigneeId !== "" && assigneeId !== "undefined" ? assigneeId : null,
          description,
        },
      });

      return c.json({ data: task });
    }
  )
  .get("/:taskId", async (c) => {
    const user = await requireAuth();
    const { taskId } = c.req.param();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignee: true,
      },
    });

    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    const member = await getMember({
      workspaceId: task.workspaceId,
      userId: user.id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const assignee = task.assignee ? {
      ...task.assignee,
      name: task.assignee.name || task.assignee.email,
      email: task.assignee.email,
    } : null;

    return c.json({
      data: {
        ...task,
        project: task.project,
        assignee,
      },
    });
  })
  .post(
    "/bulk-update",
    zValidator(
      "json",
      z.object({
        tasks: z.array(
          z.object({
            id: z.string(),
            status: z.nativeEnum(TaskStatus),
            position: z.number().int().positive().min(1000).max(1_000_000),
          })
        ),
      })
    ),
    async (c) => {
      const user = await requireAuth();
      const { tasks } = await c.req.valid("json");

      const tasksToUpdate = await prisma.task.findMany({
        where: {
          id: {
            in: tasks.map((task) => task.id),
          },
        },
      });

      const workspaceIds = new Set(
        tasksToUpdate.map((task) => task.workspaceId)
      );
      
      if (workspaceIds.size !== 1) {
        return c.json({ error: "All tasks must belong to the same workspace" });
      }

      const workspaceId = workspaceIds.values().next().value;

      if (!workspaceId) {
        return c.json({ error: "Workspace ID is required" }, 400);
      }

      const member = await getMember({
        workspaceId,
        userId: user.id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          const { id, status, position } = task;
          return prisma.task.update({
            where: { id },
            data: {
              status,
              position,
            },
          });
        })
      );

      return c.json({ data: updatedTasks });
    }
  );

export default app;
