import { LoginCard } from "@/components/auth/login-card";

type LoginScreenProps = {
  registered?: boolean;
  signupClosed?: boolean;
};

export function LoginScreen({ registered = false, signupClosed = false }: LoginScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <LoginCard registered={registered} signupClosed={signupClosed} />
    </main>
  );
}
