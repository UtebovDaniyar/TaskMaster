import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { SignInCard } from "@/features/auth/components/sign-in-card";

const SignInPage = async () => {
  try {
    const user = await getCurrent();
    if (user) redirect("/");
  } catch (error) {
    // Игнорируем ошибки получения текущего пользователя на странице входа
    console.log("Error getting current user on sign-in page:", error);
  }

  return <SignInCard />;
};
 
export default SignInPage;
