"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { agregarMarca } from "@/app/prospectos/muestra-actions";
import { CATEGORIAS_PRODUCTO } from "@/lib/validation/lead";

/**
 * Agregar a mano una marca que encontraste en Instagram.
 *
 * Es la otra mitad del embudo. /prueba recibe a quien llega solo; esto
 * registra a quien encontraste tú buscando el nicho — que al principio es
 * el canal que mejor convierte, porque puedes ver el Instagram de una marca
 * y saber si su contenido está mal antes de escribirle.
 */
export function AgregarMarca() {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const [guardando, empezar] = useTransition();

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const forma = evento.currentTarget;
    setError(null);
    setListo(null);

    empezar(async () => {
      const r = await agregarMarca({
        negocio: formulario.get("negocio"),
        giro: formulario.get("giro"),
        instagram: formulario.get("instagram"),
        vende: formulario.get("vende"),
      });
      if (r.success) {
        setListo(String(formulario.get("negocio") ?? "La marca"));
        forma.reset();
      } else {
        setError(r.error);
      }
    });
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-medium text-zinc-700 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Plus className="h-4 w-4 text-accent" strokeWidth={2} />
        Agregar una marca que encontraste
      </button>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="rounded-2xl bg-white p-5 shadow-[var(--relieve-pieza)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Agregar una marca que encontraste
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Sin teléfono: todavía no sabe que existes. Le escribes por Instagram con la
            muestra hecha.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAbierto(false)}>
          Cerrar
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="marca-negocio">Nombre de la marca</Label>
          <Input id="marca-negocio" name="negocio" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="marca-instagram">Instagram</Label>
          <Input
            id="marca-instagram"
            name="instagram"
            required
            placeholder="@sumarca"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="marca-giro">Categoría</Label>
        <select
          id="marca-giro"
          name="giro"
          required
          defaultValue=""
          className="mt-1.5 h-11 w-full rounded-xl bg-white px-3.5 text-sm text-zinc-900 shadow-[var(--relieve-pozo)] outline-none"
        >
          <option value="" disabled>
            Elige una
          </option>
          {CATEGORIAS_PRODUCTO.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <Label htmlFor="marca-vende">Qué producto le vas a usar</Label>
        <Textarea
          id="marca-vende"
          name="vende"
          placeholder="El que más publica o el que se ve mejor en su feed."
          className="mt-1.5 min-h-[64px]"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" loading={guardando}>
          Agregar
        </Button>
        {listo && (
          <span className="text-sm text-emerald-700">
            {listo} quedó en la lista. Súbele fotos y genera su muestra.
          </span>
        )}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </form>
  );
}
