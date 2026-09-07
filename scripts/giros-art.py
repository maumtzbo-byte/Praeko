"""Prepara los símbolos de los giros para `public/giros/`.

Uso: python3 scripts/giros-art.py <lamina-de-6> <lamina-de-3>

Vienen en dos láminas de distinto reparto — una de 3x2 y otra de 3x1 — y
cada celda con su propio tono de fondo, así que se normaliza por separado.
Un solo valor para todas deja recuadro visible en la mitad de ellas.

Dos de los símbolos traen texto en inglés horneado en el render, "NEW" en
el carrito y "SOLD" en la casa. En una landing en español eso canta, y no
se quita recortando porque está sobre el objeto. Se borra reconstruyendo el
color que hay debajo: se le ajusta una cuadrática a la zona y se repinta
encima de las letras. El ajuste se acota a los píxeles del propio sello
—`fit_margin`— porque sin eso entra el verde del carrito que lo cruza por
delante y el parche sale gris en vez de coral.
"""

import importlib.util
import os
import sys

import numpy as np
from PIL import Image

_spec = importlib.util.spec_from_file_location(
    "art", os.path.join(os.path.dirname(os.path.abspath(__file__)), "agent-art.py")
)
_art = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_art)

# Orden de lectura de cada lámina, izquierda a derecha y arriba a abajo.
SEIS = ["gimnasio", "cafeteria", "restaurante", "tienda", "inmobiliaria", "servicios"]
TRES = ["apps", "saas", "agencias"]

# Cajas del texto a borrar, en coordenadas de la lámina de seis.
TEXTOS = [(242, 470, 338, 524), (748, 585, 838, 628)]


def limpiar(arr):
    for caja in TEXTOS:
        # dark_margin altísimo para que no marque nada oscuro: el texto es
        # claro sobre color, así que lo que hay que cazar es lo brillante.
        arr, _ = _art.delogo(arr, caja, dark_margin=250, light_margin=10, dilate=6, fit_margin=18)
    return arr


def exportar(celda, destino, lado=360):
    a = celda.astype(np.float32)
    borde = np.concatenate([a[:10].reshape(-1, 3), a[-10:].reshape(-1, 3),
                            a[:, :10].reshape(-1, 3), a[:, -10:].reshape(-1, 3)])
    plano = np.clip(a * (255.0 / np.median(borde, axis=0)), 0, 255)
    ys, xs = np.where(plano.min(axis=2) < 248)
    pad = 12
    caja = (max(0, xs.min() - pad), max(0, ys.min() - pad),
            min(a.shape[1], xs.max() + 1 + pad), min(a.shape[0], ys.max() + 1 + pad))
    rec = Image.fromarray(plano.astype(np.uint8)).crop(caja)
    # Lienzo cuadrado para que los nueve ocupen la misma caja en la página
    # aunque unos sean anchos y otros altos.
    lienzo = Image.new("RGB", (max(rec.size),) * 2, (255, 255, 255))
    lienzo.paste(rec, ((max(rec.size) - rec.width) // 2, (max(rec.size) - rec.height) // 2))
    lienzo.resize((lado, lado), Image.LANCZOS).save(destino, quality=90, method=6)


def main(lamina_seis, lamina_tres, salida="public/giros"):
    os.makedirs(salida, exist_ok=True)

    a = limpiar(np.array(Image.open(lamina_seis).convert("RGB")))
    h, w, _ = a.shape
    for k, nombre in enumerate(SEIS):
        c, f = k % 3, k // 3
        exportar(a[f * (h // 2):(f + 1) * (h // 2), c * (w // 3):(c + 1) * (w // 3)],
                 os.path.join(salida, f"{nombre}.webp"))

    b = np.array(Image.open(lamina_tres).convert("RGB"))
    h, w, _ = b.shape
    for k, nombre in enumerate(TRES):
        exportar(b[:, k * (w // 3):(k + 1) * (w // 3)], os.path.join(salida, f"{nombre}.webp"))

    for f in sorted(os.listdir(salida)):
        print(f"  {f:20s} {os.path.getsize(os.path.join(salida, f)) // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
