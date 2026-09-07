#!/usr/bin/env python3
"""Arregla el fondo de los símbolos 3D de la landing. Dos tratamientos,
porque son dos problemas distintos.

El diagnóstico, medido en las capturas del teléfono, no deducido:

  · Los símbolos de giros (IndustryScrollGallery) dejan un recuadro
    permanente. El fondo de esos archivos no es blanco puro sino 254.5 de
    promedio, con orillas que bajan a 226 por ruido de compresión.
    Multiplicado contra la página (244) da 243: un nivel de diferencia,
    invisible en un monitor y perfectamente visible como recuadro en un
    OLED. En la captura del usuario: parche plano de 243 en x=151..318 de
    la fila 872, sobre página de 244.

  · Los símbolos de pasos (HowItWorks) parpadean medio segundo al entrar.
    Ahí el `motion.div` anima opacidad y desplazamiento, las dos cosas
    crean contexto de apilamiento, y eso AÍSLA el mix-blend-multiply. Sin
    blend, durante esos 450 ms se ve el rectángulo blanco del archivo
    contra el gris de la página: 255 contra 244, once niveles.

Tratamiento 1 — alfa de verdad (giros). Se puede porque el sujeto es
de color y el fondo blanco. Quita el blend y con él las dos fallas.

Tratamiento 2 — blanquear a 255 exacto (pasos). Ahí el sujeto es
plástico BLANCO sobre fondo blanco: no hay señal que los separe, igual
que con el muñeco del hero. Cualquier recorte se come el objeto —
probado, el avión de papel quedaba en 10% de píxeles opacos. Lo que sí
se puede es dejar el fondo en 255 exacto para que el multiply sea una
identidad y no queden 243. El parpadeo se arregla en el componente,
pintando el color de la página en el elemento que anima.
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = Path(__file__).resolve().parent.parent

# Debajo de este brillo el pixel ya no puede ser fondo: es sujeto o es
# sombra. 248 y no 255 porque los archivos traen ruido de compresión.
UMBRAL_FONDO = 248.0
# Cobertura mínima para contar como cuerpo del objeto. 0.25 deja fuera la
# sombra suave (que anda en 0.05-0.20) y deja dentro hasta la cara más
# clara de un objeto de color.
COBERTURA_NUCLEO = 0.25


def cobertura(rgb: np.ndarray) -> np.ndarray:
    """Qué tanto se aleja cada pixel del blanco puro, 0 a 1.

    Es exactamente lo que hace `mix-blend-multiply`, solo que guardado en
    el canal alfa en vez de calculado cada cuadro por el navegador.
    """
    return np.clip(1.0 - rgb.min(2) / 255.0, 0.0, 1.0)


def recortar(src: Path, dst: Path, margen: int = 12) -> dict:
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)
    cob = cobertura(rgb)

    # El cuerpo del objeto, con sus huecos tapados. Tapar los huecos es lo
    # que salva los blancos de ADENTRO —el papel del certificado, la cara
    # iluminada de la taza—: por brillo son idénticos al fondo, y sin este
    # paso quedaban transparentes. La sombra de abajo NO entra aquí
    # porque su cobertura no llega al umbral, y por eso sobrevive como
    # negro semitransparente en vez de volverse un manchón opaco.
    nucleo = ndimage.binary_fill_holes(cob > COBERTURA_NUCLEO)
    # Fuera los puntitos sueltos que deja la compresión en el fondo.
    etiquetas, n = ndimage.label(nucleo)
    if n:
        areas = ndimage.sum(nucleo, etiquetas, range(1, n + 1))
        vivas = np.where(areas > 200)[0] + 1
        nucleo = np.isin(etiquetas, vivas)

    alfa = np.where(nucleo, 1.0, cob)
    # El salto de 1 a cobertura cae justo en el borde antialiaseado; medio
    # pixel de suavizado le quita el escalón sin engordar la silueta.
    alfa = ndimage.gaussian_filter(alfa, 0.6)

    # Despremultiplicar. El archivo trae el objeto ya mezclado con blanco;
    # sin deshacer esa mezcla la sombra saldría gris opaco encima de
    # cualquier fondo que no sea blanco.
    a = np.clip(alfa, 1e-3, 1.0)[..., None]
    color = np.clip((rgb - 255.0 * (1.0 - a)) / a, 0, 255)
    color = np.where(alfa[..., None] < 0.004, 255.0, color)

    rgba = np.dstack([color, alfa * 255.0]).round().astype(np.uint8)

    # Recorte al contenido en lienzo cuadrado. Los archivos traían aire
    # distinto cada uno y, metidos todos en la misma caja CSS, unos se
    # veían más chicos que otros sin razón.
    ys, xs = np.where(alfa > 0.02)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    lado = max(y1 - y0, x1 - x0) + margen * 2
    lienzo = np.zeros((lado, lado, 4), dtype=np.uint8)
    lienzo[..., :3] = 255
    py, px = (lado - (y1 - y0)) // 2, (lado - (x1 - x0)) // 2
    lienzo[py:py + (y1 - y0), px:px + (x1 - x0)] = rgba[y0:y1, x0:x1]

    # alpha_quality aparte del color: el alfa es casi todo plano —0 o 255,
    # con una rampa corta en el borde— y aguanta más compresión que el
    # dibujo. Con q=80/alpha=88 los nueve símbolos pesan 179 KB en vez de
    # 222, y el peor archivo se aleja 2.4 de 255 del guardado sin pérdida.
    #
    # Aun así son 105 KB más que los 73 de antes: eso cuesta el canal alfa,
    # y se paga a cambio de que el recuadro desaparezca de verdad en vez de
    # depender de que el fondo del archivo esté en 255 exacto.
    Image.fromarray(lienzo, "RGBA").save(
        dst, "WEBP", quality=80, alpha_quality=88, method=6, exact=True
    )
    return {
        "opaco%": round(100 * (alfa > 0.98).mean(), 1),
        "suave%": round(100 * ((alfa > 0.02) & (alfa < 0.98)).mean(), 1),
        "lado": int(lado),
        "kb": round(dst.stat().st_size / 1024, 1),
    }


def blanquear(src: Path, dst: Path) -> dict:
    """Deja el fondo en 255 exacto, sin tocar el objeto.

    Todo lo que esté por encima del umbral Y conectado al borde es fondo.
    La condición de conexión es la que impide que esto blanquee también
    las caras claras del objeto, que están al mismo brillo.
    """
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)
    L = rgb.mean(2)

    etiquetas, _ = ndimage.label(L >= UMBRAL_FONDO)
    borde = np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]])
    fondo = np.isin(etiquetas, np.unique(borde[borde > 0]))
    # Un pixel adentro: la orilla del fondo colinda con el degradado del
    # antialiasing y aplanarla a 255 dejaría un escalón en el contorno.
    fondo = ndimage.binary_erosion(fondo, iterations=1)

    antes = rgb[fondo].mean()
    salida = rgb.copy()
    salida[fondo] = 255.0
    Image.fromarray(salida.round().astype(np.uint8), "RGB").save(
        dst, "WEBP", quality=92, method=6
    )
    return {"fondo_antes": round(antes, 1), "fondo_ahora": 255, "kb": round(dst.stat().st_size / 1024, 1)}


def main() -> None:
    giros = RAIZ / "public/giros"
    for src in sorted(giros.glob("*.webp")):
        print(f"alfa   {src.name:20}", recortar(src, giros / f"{src.stem}.tmp.webp"))
    for tmp in sorted(giros.glob("*.tmp.webp")):
        tmp.replace(giros / tmp.name.replace(".tmp", ""))

    pasos = RAIZ / "public/pasos"
    for src in sorted(pasos.glob("*.webp")):
        print(f"blanco {src.name:20}", blanquear(src, pasos / f"{src.stem}.tmp.webp"))
    for tmp in sorted(pasos.glob("*.tmp.webp")):
        tmp.replace(pasos / tmp.name.replace(".tmp", ""))


if __name__ == "__main__":
    main()
