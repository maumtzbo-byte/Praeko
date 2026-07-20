"use client";

import { useRef, useState } from "react";
import { Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface GalleryPhoto {
  id: string;
  storagePath: string;
  liked: boolean;
  signedUrl: string | null;
}

export function GalleryGrid({
  businessId,
  initialPhotos,
}: {
  businessId: string;
  initialPhotos: GalleryPhoto[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const path = `${businessId}/gallery/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("brand-assets").upload(path, file);
      if (uploadError) {
        toast.error(`No se pudo subir "${file.name}": ${uploadError.message}`);
        continue;
      }
      const { data: inserted, error: insertError } = await supabase
        .from("brand_assets")
        .insert({ business_id: businessId, asset_type: "photo", storage_path: path })
        .select("id")
        .single();
      if (insertError || !inserted) {
        toast.error(`"${file.name}" se subió, pero no se pudo registrar.`);
        continue;
      }
      const { data: signed } = await supabase.storage.from("brand-assets").createSignedUrl(path, 3600);
      setPhotos((prev) => [
        { id: inserted.id, storagePath: path, liked: false, signedUrl: signed?.signedUrl ?? null },
        ...prev,
      ]);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function toggleLiked(photo: GalleryPhoto) {
    const nextLiked = !photo.liked;
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, liked: nextLiked } : p)));
    const supabase = createClient();
    const { error } = await supabase.from("brand_assets").update({ liked: nextLiked }).eq("id", photo.id);
    if (error) {
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, liked: photo.liked } : p)));
      toast.error("No se pudo actualizar.");
    }
  }

  async function deletePhoto(photo: GalleryPhoto) {
    const previous = photos;
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    const supabase = createClient();
    const [{ error: storageError }, { error: rowError }] = await Promise.all([
      supabase.storage.from("brand-assets").remove([photo.storagePath]),
      supabase.from("brand_assets").delete().eq("id", photo.id),
    ]);
    if (storageError || rowError) {
      setPhotos(previous);
      toast.error("No se pudo eliminar la foto.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-zinc-300 bg-white/50 px-6 py-10 text-center transition-colors hover:border-zinc-400",
          uploading && "pointer-events-none opacity-70",
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)]">
          <UploadCloud className={cn("h-5 w-5 text-accent", uploading && "animate-pulse")} strokeWidth={1.5} />
        </span>
        <span className="text-sm font-medium text-zinc-700">
          {uploading ? "Subiendo…" : "Sube fotos de referencia"}
        </span>
        <span className="text-xs text-zinc-500">PNG o JPG — puedes elegir varias a la vez</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
      </label>

      {photos.length === 0 ? null : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">
              {photo.signedUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.signedUrl} alt="" className="h-full w-full object-cover" />
              )}

              <button
                type="button"
                onClick={() => toggleLiked(photo)}
                aria-label={photo.liked ? "Quitar de favoritos" : "Marcar como favorita"}
                className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
              >
                <Star
                  className={cn("h-4 w-4", photo.liked ? "fill-amber-400 text-amber-400" : "text-zinc-400")}
                  strokeWidth={1.75}
                />
              </button>

              <button
                type="button"
                onClick={() => deletePhoto(photo)}
                aria-label="Eliminar foto"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:scale-105 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4 text-red-600" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
