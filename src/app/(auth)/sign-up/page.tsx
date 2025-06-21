import { redirect } from "next/navigation";

import { SignUpCard } from "@/features/auth/components/sign-up-card";
import { getCurrent } from "@/features/auth/queries";

const SignUpPage = async () => {
  try {
    const user = await getCurrent();
    if (user) redirect("/");
  } catch (error) {
    // Игнорируем ошибки получения текущего пользователя на странице регистрации
    console.log("Error getting current user on sign-up page:", error);
  }

  return <SignUpCard />;
};

export default SignUpPage;
