import { getCurrentUser } from "@/lib/session";

export const getCurrent = async () => {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
};
