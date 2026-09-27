import { redirect } from "next/navigation";

// Sign-up and sign-in are unified — the magic-link form on /sign-in
// creates the account automatically if the email is new. This route
// stays so old links don't break.
export default function SignUpPage() {
  redirect("/sign-in");
}
