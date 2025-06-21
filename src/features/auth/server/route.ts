import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "@/lib/prisma";

import { loginSchema, registerSchema } from "../schemas";

const app = new Hono()
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email } = c.req.valid("json");

    // Для NextAuth мы будем использовать OAuth провайдеры
    // Этот эндпоинт может быть использован для кастомной аутентификации
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // TODO: Implement password verification if using custom auth
    // For now, we'll redirect to OAuth
    return c.json({ 
      success: false, 
      message: "Please use OAuth login" 
    });
  })
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { email } = c.req.valid("json");

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    // TODO: Implement password hashing if using custom auth
    // For now, we'll redirect to OAuth
    return c.json({ 
      success: false, 
      message: "Please use OAuth registration" 
    });
  });

export default app;
