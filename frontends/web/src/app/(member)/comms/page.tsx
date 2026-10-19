import { redirect } from "next/navigation";

export default function CommsIndex() {
  redirect("/comms/messages");
}
