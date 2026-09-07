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

import json
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


def angulos(m):
    """Giro y altura aproximados de la cabeza.

    El giro sale del reparto de área entre una mica y la otra: al girar, la
    mica lejana se escorza y pierde área. La altura sale de dónde quedan
    los ojos en el cuadro, que con el cuerpo quieto es cabecear.

    Las dos son las únicas señales que sobreviven a la compresión de un
    video: el color de las micas es lo único que se distingue con
    seguridad del blanco del cuerpo y del negro del armazón."""
    ys, xs = np.where(m)
    if len(xs) < 800:
        return None
    centro = (xs.min() + xs.max()) / 2
    izq, der = (xs < centro).sum(), (xs >= centro).sum()
    return (der - izq) / (der + izq), float(ys.mean()), int(len(xs))


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


def main(video, radio=0.085, salida="public/hero/giro", alto=850):
    """Selecciona cuadros que cubran el plano giro × altura y los exporta.

    No se eligen a intervalos regulares porque el video no barre una
    retícula: traza una espiral por ese plano, y hay combinaciones que
    simplemente no grabó — mirar arriba y a la derecha a la vez, por
    ejemplo. Con intervalos regulares se pediría un ángulo inexistente y
    saldría repetido el mismo cuadro.

    En vez de eso se recorren los cuadros del más al menos definido — el
    que muestra más área de mica es el que mejor se ve — y se va quedando
    con los que estén a cierta distancia de todos los ya elegidos. El
    resultado cubre lo que el video sí tiene, sin repetir.

    Se exporta además un manifiesto con la posición de cada cuadro en ese
    plano, que es lo que el navegador usa para buscar el más cercano al
    cursor."""
    with tempfile.TemporaryDirectory() as tmp:
        fs = extraer(video, tmp)
        print(f"{len(fs)} cuadros extraídos")

        medidas = []
        for i, f in enumerate(fs):
            a = np.array(Image.open(f).convert("RGB")).astype(int)
            m = angulos(micas(a))
            if m is not None:
                medidas.append((i, *m))
        giro = np.array([m[1] for m in medidas])
        altura = np.array([m[2] for m in medidas])
        area = np.array([m[3] for m in medidas])
        print(f"giro: {giro.min():+.2f} a {giro.max():+.2f} | "
              f"altura de ojos: {altura.min():.0f} a {altura.max():.0f} px")

        # El signo se invierte, y no es un detalle: un sesgo negativo
        # significa que la mica DERECHA perdió área por escorzo, o sea que
        # la cara apunta hacia la derecha del espectador. Verificado
        # mirando los dos cuadros extremos, no deducido. Sin invertirlo, el
        # personaje voltea al lado contrario del cursor.
        G = -((giro - giro.min()) / (giro.max() - giro.min()) * 2 - 1)
        # La altura no se invierte: los ojos más abajo en el cuadro es
        # mirar hacia abajo, que es lo que se quiere cuando el cursor está
        # abajo.
        A = (altura - altura.min()) / (altura.max() - altura.min()) * 2 - 1

        elegidos = []
        for k in np.argsort(-area):
            if all((G[k] - G[j]) ** 2 + (A[k] - A[j]) ** 2 > radio * radio for j in elegidos):
                elegidos.append(int(k))
        print(f"{len(elegidos)} cuadros cubren el plano con radio {radio}")

        planos, anclas = [], []
        for k in elegidos:
            p = aplanar(np.array(Image.open(fs[medidas[k][0]]).convert("RGB")).astype(np.float64))
            planos.append(p)
            anclas.append(ancla(p))

        cx_ref = float(np.median([a[0] for a in anclas]))
        y_ref = int(np.median([a[1] for a in anclas]))
        cajas = []
        for (cx, yb, (x0, x1, y0)) in anclas:
            dx, dy = int(round(cx_ref - cx)), int(round(y_ref - yb))
            cajas.append((x0 + dx, x1 + dx, y0 + dy))
        X0 = min(c[0] for c in cajas) - 20
        X1 = max(c[1] for c in cajas) + 20
        Y0 = min(c[2] for c in cajas) - 20

        os.makedirs(salida, exist_ok=True)
        for viejo in os.listdir(salida):
            os.remove(os.path.join(salida, viejo))
        h, w, _ = planos[0].shape
        manifiesto = []
        ancho = 0
        for n, (p, (cx, yb, _), k) in enumerate(zip(planos, anclas, elegidos)):
            dx, dy = int(round(cx_ref - cx)), int(round(y_ref - yb))
            movido = np.full_like(p, 255.0)
            sy0, sy1 = max(0, -dy), min(h, h - dy)
            sx0, sx1 = max(0, -dx), min(w, w - dx)
            movido[sy0 + dy:sy1 + dy, sx0 + dx:sx1 + dx] = p[sy0:sy1, sx0:sx1]
            rec = Image.fromarray(movido.astype(np.uint8)).crop(
                (max(0, X0), max(0, Y0), min(w, X1), h))
            ancho = round(rec.width * alto / rec.height)
            rec.resize((ancho, alto), Image.LANCZOS).save(
                os.path.join(salida, f"{n:02d}.webp"), quality=82, method=6)
            manifiesto.append({"g": round(float(G[k]), 4), "a": round(float(A[k]), 4)})

        with open(os.path.join(salida, "cuadros.json"), "w") as fh:
            json.dump({"ancho": ancho, "alto": alto, "cuadros": manifiesto}, fh)
        peso = sum(os.path.getsize(os.path.join(salida, f)) for f in os.listdir(salida))
        print(f"{len(elegidos)} cuadros de {ancho}x{alto} — {peso // 1024} KB en total")


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 0.085)
