import { redirect } from "next/navigation";
import { RegisterScreen } from "@/features/auth/components/register-screen";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import { isPublicRegistrationOpen } from "@/features/auth/lib/user-admin";

export default async function RegisterPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const signupClosed = !(await isPublicRegistrationOpen());

  return <RegisterScreen signupClosed={signupClosed} />;
}


