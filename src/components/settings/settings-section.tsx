import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function SettingsSection({
  title,
  description,
  saving,
  onSave,
  children,
}: {
  title: string;
  description?: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pb-0">
        {children}
        {/* Sticky, not just end-of-form — on the longer tabs (Marca, Info.
            para la IA) the save button used to be a full scroll away. */}
        <div className="sticky bottom-0 -mx-6 flex justify-end rounded-b-3xl border-t border-zinc-100 bg-white/90 px-6 py-5 backdrop-blur-sm ">
          <Button type="button" onClick={onSave} loading={saving}>
            Guardar cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
