"""Convierte un video del personaje girando la cabeza en los cuadros del hero.

Uso: python3 scripts/hero-giro.py <video.mp4> [cuadros]

El video se graba girando la cabeza de un lado al otro. De ahí salen N
imágenes fijas que el navegador va intercambiando según dónde apunte el
cursor. Se usa video y no N generaciones sueltas porque un modelo de video
produce una secuencia continua: la consistencia entre cuadros sale gratis,
que es justo lo que no se consigue generando imágenes una por una.

Tres cosas que este script resuelve y que no son obvias:

1. Los cuadros se eligen por ÁNGULO, no por tiempo. El video barre a un
   lado, vuelve, barre al otro y regresa, así que los ángulos necesarios
   están repartidos por toda la duración y no en un tramo continuo. El
   ángulo se estima por el reparto de área entre una mica y la otra: al
   girar, la mica lejana se escorza y pierde área. Es lo único que se
   detecta limpio en un video comprimido, donde el color va submuestreado.

2. El fondo se APLANA, no se recorta. Recortarlo es imposible aquí: el
   personaje es blanco sobre un fondo beige de luminancia casi idéntica, y
   sus zonas iluminadas son literalmente más claras que el fondo. Probado
   por umbral (se abre en agujeros) y por inundación desde el borde (se
   cuela hacia adentro por esas mismas zonas). Lo que sí funciona es
   ajustar una superficie suave al fondo — medida en los márgenes, donde
   el personaje nunca pisa — y dividir la imagen entre ella. El fondo
   queda en blanco exacto y la página lo disuelve por multiplicación,
   igual que el resto de los renders del sitio.

3. Los cuadros se ALINEAN entre sí. El cuerpo se mueve durante el video, y
   sin corregirlo el personaje entero brinca al cambiar de cuadro en vez
   de girar solo la cabeza. Se alinea por el centroide de las piernas, que
   es la parte que debería estar quieta.
"""

import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image


def extraer(video, destino):
    import imageio_ffmpeg

    subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error",
         "-i", video, "-vsync", "0", "-q:v", "2", os.path.join(destino, "f%04d.png")],
        check=True,
    )
    return sorted(os.path.join(destino, f) for f in os.listdir(destino))


def micas(a):
    """Las micas son lo único de la imagen con tinte azul verdoso."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (b - r > 8) & (g > 110) & (b > 120)


def sesgo(m):
    """Ángulo aproximado de la cabeza, de -1 (girada hacia un lado) a +1."""
    ys, xs = np.where(m)
    if len(xs) < 800:
        return None
    centro = (xs.min() + xs.max()) / 2
    izq, der = (xs < centro).sum(), (xs >= centro).sum()
    return (der - izq) / (der + izq)


def aplanar(a, margen_sup=55, margen_lat=45):
    """Divide la imagen entre una superficie ajustada al fondo, medida solo
    en los márgenes donde el personaje nunca entra."""
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    yn, xn = yy / h, xx / w
    fondo = np.zeros((h, w), bool)
    fondo[:margen_sup] = True
    fondo[:, :margen_lat] = True
    fondo[:, -margen_lat:] = True
    terminos = [np.ones_like(xn), xn, yn, xn * yn, xn ** 2, yn ** 2, xn ** 2 * yn, xn * yn ** 2]
    A = np.stack([t[fondo] for t in terminos], axis=1)
    full = np.stack([t.ravel() for t in terminos], axis=1)
    modelo = np.zeros_like(a)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, a[fondo, c], rcond=None)
        modelo[..., c] = (full @ coef).reshape(h, w)
    return np.clip(a * (255.0 / np.maximum(modelo, 1)), 0, 255)


def ancla(plano):
    """Centroide horizontal de las piernas y borde inferior del personaje."""
    cuerpo = plano.mean(axis=2) < 248
    ys, xs = np.where(cuerpo)
    corte = int(np.percentile(ys, 70))
    piernas = xs[ys >= corte]
    return float(np.median(piernas)), int(ys.max()), (int(xs.min()), int(xs.max()), int(ys.min()))


def main(video, n_cuadros=13, salida="public/hero/giro", alto=1100):
    with tempfile.TemporaryDirectory() as tmp:
        fs = extraer(video, tmp)
        print(f"{len(fs)} cuadros extraídos")

        angulos = []
        for f in fs:
            a = np.array(Image.open(f).convert("RGB")).astype(int)
            angulos.append(sesgo(micas(a)))
        validos = [(i, s) for i, s in enumerate(angulos) if s is not None]
        lo = min(s for _, s in validos)
        hi = max(s for _, s in validos)
        print(f"barrido de ángulo: {lo:+.2f} a {hi:+.2f}")

        # Índice 0 = cabeza girada hacia la izquierda del espectador. El
        # sesgo negativo es la mica derecha escorzada, o sea la cabeza
        # girada hacia la derecha del espectador: por eso el orden se
        # invierte. Sin esto, el personaje mira al lado contrario del clic.
        objetivos = np.linspace(hi, lo, n_cuadros)
        elegidos = [min(validos, key=lambda v: abs(v[1] - t))[0] for t in objetivos]

        planos, anclas = [], []
        for i in elegidos:
            p = aplanar(np.array(Image.open(fs[i]).convert("RGB")).astype(np.float64))
            planos.append(p)
            anclas.append(ancla(p))

        # Encuadre común: la caja que contiene al personaje en todos los
        # cuadros ya alineados, con un respiro alrededor.
        cx_ref = float(np.median([a[0] for a in anclas]))
        y_ref = int(np.median([a[1] for a in anclas]))
        cajas = []
        for p, (cx, yb, (x0, x1, y0)) in zip(planos, anclas):
            dx, dy = int(round(cx_ref - cx)), int(round(y_ref - yb))
            cajas.append((x0 + dx, x1 + dx, y0 + dy))
        X0 = min(c[0] for c in cajas) - 20
        X1 = max(c[1] for c in cajas) + 20
        Y0 = min(c[2] for c in cajas) - 20

        os.makedirs(salida, exist_ok=True)
        h, w, _ = planos[0].shape
        for k, (p, (cx, yb, _)) in enumerate(zip(planos, anclas)):
            dx, dy = int(round(cx_ref - cx)), int(round(y_ref - yb))
            movido = np.full_like(p, 255.0)
            sy0, sy1 = max(0, -dy), min(h, h - dy)
            sx0, sx1 = max(0, -dx), min(w, w - dx)
            movido[sy0 + dy:sy1 + dy, sx0 + dx:sx1 + dx] = p[sy0:sy1, sx0:sx1]
            rec = Image.fromarray(movido.astype(np.uint8)).crop(
                (max(0, X0), max(0, Y0), min(w, X1), h)
            )
            ancho = round(rec.width * alto / rec.height)
            rec.resize((ancho, alto), Image.LANCZOS).save(
                os.path.join(salida, f"{k:02d}.webp"), quality=90, method=6
            )
        peso = sum(os.path.getsize(os.path.join(salida, f)) for f in os.listdir(salida))
        print(f"{n_cuadros} cuadros de {ancho}x{alto} — {peso // 1024} KB en total")
        print(f"desplazamientos aplicados: x {[int(round(cx_ref - a[0])) for a in anclas]}")


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 13)
