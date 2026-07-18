import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { GalleryGrid } from "@/components/dashboard/gallery-grid";

export default async function GaleriaPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: photos } = await supabase
    .from("brand_assets")
    .select("id, storage_path, liked")
    .eq("business_id", business.id)
    .eq("asset_type", "photo")
    .order("created_at", { ascending: false });

  const initialPhotos = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from("brand-assets")
        .createSignedUrl(photo.storage_path, 3600);
      return {
        id: photo.id,
        storagePath: photo.storage_path,
        liked: photo.liked,
        signedUrl: signed?.signedUrl ?? null,
      };
    }),
  );

  return (
    <div>
      <PageHeader
        title="Galería"
        description="Sube fotos de tu negocio, productos o estilo que te gusten — la IA las usa como referencia al crear contenido nuevo."
      />
      <GalleryGrid businessId={business.id} initialPhotos={initialPhotos} />
    </div>
  );
}
