import { redirect } from "next/navigation";

/** Register redirects to login page — shared auth form handles both modes. */
export default function RegisterPage() {
  redirect("/login?mode=register");
}
