import Link from "next/link";
import { Palette, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function MarcaPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  const { data: logoAsset } = await supabase
    .from("brand_assets")
    .select("storage_path")
    .eq("business_id", business.id)
    .eq("asset_type", "logo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let logoUrl: string | null = null;
  if (logoAsset) {
    const { data: signed } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(logoAsset.storage_path, 3600);
    logoUrl = signed?.signedUrl ?? null;
  }

  const editAction = (
    <Link href="/dashboard/configuracion?tab=marca">
      <Button variant="secondary" size="sm">
        <Pencil className="h-3.5 w-3.5" /> Editar marca
      </Button>
    </Link>
  );

  if (!brandProfile) {
    return (
      <div>
        <PageHeader title="Marca" description="El kit de marca que usan tus agentes de IA." actions={editAction} />
        <EmptyState
          icon={Palette}
          title="Todavía no hay información de marca"
          description="Completa el paso de marca en tu configuración para que la IA genere contenido consistente con tu identidad."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Marca" description="El kit de marca que usan tus agentes de IA." actions={editAction} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`Logo de ${business.name}`} className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <p className="text-sm text-zinc-500">Sin logo subido todavía.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colores</CardTitle>
          </CardHeader>
          <CardContent>
            {brandProfile.color_palette && brandProfile.color_palette.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {brandProfile.color_palette.map((color) => (
                  <Badge key={color}>{color}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Sin colores definidos todavía.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipografías</CardTitle>
          </CardHeader>
          <CardContent>
            {brandProfile.preferred_fonts && brandProfile.preferred_fonts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {brandProfile.preferred_fonts.map((font) => (
                  <Badge key={font}>{font}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Sin tipografías definidas todavía.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tono de comunicación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">{brandProfile.brand_tone || "Sin definir todavía."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Misión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">{brandProfile.mission || "Sin definir todavía."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Público objetivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">{brandProfile.target_audience || "Sin definir todavía."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
