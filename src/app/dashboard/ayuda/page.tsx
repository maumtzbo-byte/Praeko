import { LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AyudaPage() {
  return (
    <div>
      <PageHeader title="Ayuda" description="¿Tienes dudas? Aquí puedes contactarnos." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
              <Mail className="h-5 w-5 text-zinc-600" strokeWidth={1.5} />
            </span>
            <CardTitle>Escríbenos por correo</CardTitle>
            <CardDescription>Respondemos en menos de 24 horas hábiles.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="mailto:soporte@praeko.com" className="text-sm font-medium text-zinc-900 underline">
              soporte@praeko.com
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
              <MessageCircle className="h-5 w-5 text-zinc-600" strokeWidth={1.5} />
            </span>
            <CardTitle>Centro de ayuda</CardTitle>
            <CardDescription>Guías paso a paso sobre cómo usar Praeko.</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
              <LifeBuoy className="h-4 w-4" /> Próximamente
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
