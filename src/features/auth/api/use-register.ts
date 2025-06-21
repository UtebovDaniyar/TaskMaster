import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { registerUser } from "../actions";

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const useRegister = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation<unknown, Error, RegisterRequest>({
    mutationFn: async (data) => {
      const result = await registerUser(data);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    },
    onSuccess: async (data, variables) => {
      toast.success("Registration successful!");
      
      // Автоматически выполняем вход после успешной регистрации
      const signInResult = await signIn("credentials", {
        email: variables.email,
        password: variables.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/");
        router.refresh();
        queryClient.invalidateQueries({ queryKey: ["current"] });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return mutation;
};
