import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

import { getMember } from "../utils";
import { MemberRole } from "../types";

const app = new Hono()
  .get(
    "/",
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = await requireAuth();
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({
        workspaceId,
        userId: user.id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const members = await prisma.workspaceMember.findMany({
        where: {
          workspaceId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const populatedMembers = members.map((member) => ({
        ...member,
        name: member.user.name || member.user.email,
        email: member.user.email,
      }));

      return c.json({
        data: {
          documents: populatedMembers,
          total: populatedMembers.length,
        },
      });
    }
  )
  .delete(
    "/:memberId",
    async (c) => {
      const { memberId } = c.req.param();
      const user = await requireAuth();

      const memberToDelete = await prisma.workspaceMember.findUnique({
        where: { id: memberId },
      });

      if (!memberToDelete) {
        return c.json({ error: "Member not found" }, 404);
      }

      const allMembersInWorkspace = await prisma.workspaceMember.count({
        where: {
          workspaceId: memberToDelete.workspaceId,
        },
      });

      const member = await getMember({
        workspaceId: memberToDelete.workspaceId,
        userId: user.id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      
      if (member.id !== memberToDelete.id && member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      
      if (allMembersInWorkspace === 1) {
        return c.json({ error: "Cannot delete the only member" }, 400);
      }

      await prisma.workspaceMember.delete({
        where: { id: memberId },
      });

      return c.json({ data: { $id: memberToDelete.id } });
    }
  )
  .patch(
    "/:memberId",
    zValidator("json", z.object({ role: z.nativeEnum(MemberRole) })),
    async (c) => {
      const { memberId } = c.req.param();
      const { role } = c.req.valid("json");
      const user = await requireAuth();

      const memberToUpdate = await prisma.workspaceMember.findUnique({
        where: { id: memberId },
      });

      if (!memberToUpdate) {
        return c.json({ error: "Member not found" }, 404);
      }

      const member = await getMember({
        workspaceId: memberToUpdate.workspaceId,
        userId: user.id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      
      if (member.role !== MemberRole.ADMIN) {
        return c.json({ error: "Only administrators can change member roles" }, 401);
      }

      // Count all admins in workspace
      const adminCount = await prisma.workspaceMember.count({
        where: {
          workspaceId: memberToUpdate.workspaceId,
          role: MemberRole.ADMIN,
        },
      });

      // Prevent downgrading the last admin
      if (memberToUpdate.role === MemberRole.ADMIN && role === MemberRole.MEMBER && adminCount === 1) {
        return c.json({ error: "Cannot downgrade the only administrator" }, 400);
      }

      const updatedMember = await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role },
      });

      return c.json({ data: updatedMember });
    }
  );

export default app;
