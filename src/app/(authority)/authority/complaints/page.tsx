import { redirect } from "next/navigation";

export default function AuthorityComplaintsRedirectPage() {
  redirect("/authority/queue");
}

