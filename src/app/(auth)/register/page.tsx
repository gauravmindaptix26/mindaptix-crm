import { redirect } from "next/navigation";
import { RegisterScreen } from "@/components/auth/register-screen";
import { getCurrentSession } from "@/lib/auth/auth-session";
import { isPublicRegistrationOpen } from "@/lib/auth/user-admin";

export default async function RegisterPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const signupClosed = !(await isPublicRegistrationOpen());

  return <RegisterScreen signupClosed={signupClosed} />;
}
