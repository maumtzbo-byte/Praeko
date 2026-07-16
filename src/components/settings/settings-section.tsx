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
      <CardContent className="flex flex-col gap-5">
        {children}
        <div className="flex justify-end border-t border-zinc-100 pt-5">
          <Button type="button" onClick={onSave} loading={saving}>
            Guardar cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
