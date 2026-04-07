import { redirect } from "next/navigation";
import { LoginScreen } from "@/features/auth/components/login-screen";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import { isPublicRegistrationOpen } from "@/features/auth/lib/user-admin";

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const registered = query.registered === "1" || (Array.isArray(query.registered) && query.registered.includes("1"));
  const signupClosed = !(await isPublicRegistrationOpen());

  return <LoginScreen registered={registered} signupClosed={signupClosed} />;
}


