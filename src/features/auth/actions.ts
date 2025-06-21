"use server";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { registerSchema } from "./schemas";

// Тип для создания пользователя с паролем
type CreateUserData = {
  name: string;
  email: string;
  password: string;
};

const prisma = new PrismaClient();

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  try {
    const validatedData = registerSchema.parse(data);

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Создаем пользователя
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (prisma.user.create as any)({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
      } satisfies CreateUserData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    });

    return { success: true, user };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Error registering user" };
  } finally {
    await prisma.$disconnect();
  }
} 