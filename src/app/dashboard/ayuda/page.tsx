import { Mail, MessageCircle } from "lucide-react";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { PageHeader } from "@/components/dashboard/page-header";
import { SupportChat } from "@/components/dashboard/support-chat";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AyudaPage() {
  const { business } = await getCurrentBusiness();

  return (
    <div>
      <PageHeader title="Ayuda" description="¿Tienes dudas? Aquí puedes contactarnos." />
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)] dark:from-zinc-700 dark:to-zinc-800">
              <Mail className="h-5 w-5 text-accent" strokeWidth={1.5} />
            </span>
            <CardTitle>Escríbenos por correo</CardTitle>
            <CardDescription>Respondemos en menos de 24 horas hábiles.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="mailto:soporte@frames.com" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
              soporte@frames.com
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)] dark:from-zinc-700 dark:to-zinc-800">
              <MessageCircle className="h-5 w-5 text-accent" strokeWidth={1.5} />
            </span>
            <CardTitle>Asistente de Frames</CardTitle>
            <CardDescription>Pregúntale cómo conectar tus redes, generar contenido, o cualquier otra duda del panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <SupportChat businessId={business.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
