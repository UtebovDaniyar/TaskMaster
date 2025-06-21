import { Hono } from "hono";
import { getCurrentUser } from "@/lib/session";

const app = new Hono()
  .get("/current", async (c) => {
    const user = await getCurrentUser();
    return c.json({ data: user });
  });

export default app; 