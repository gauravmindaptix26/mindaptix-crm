import { RegisterCard } from "@/components/auth/register-card";

type RegisterScreenProps = {
  signupClosed?: boolean;
};

export function RegisterScreen({ signupClosed = false }: RegisterScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <RegisterCard signupClosed={signupClosed} />
    </main>
  );
}
