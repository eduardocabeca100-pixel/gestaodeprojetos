import { redirect } from "next/navigation";

export default function HiddenSettingsPage() {
  redirect("/configuracoes/usuarios");
}
