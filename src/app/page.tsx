import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/auth-session";

export default async function Home() {
  const session = await getCurrentSession();
  redirect(session ? "/dashboard" : "/login");
}
