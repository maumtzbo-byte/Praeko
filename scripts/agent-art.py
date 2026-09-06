"""Prepara los renders de los agentes para `public/agentes/`.

Uso: python3 scripts/agent-art.py <carpeta-con-los-renders>

Hace tres cosas con cada render y lo deja como .webp:

1. Borra los logos de fabricante de los aparatos que carga el personaje.
   Es una landing comercial: la marca ajena no puede ir ahi.
2. Normaliza el fondo a blanco puro. Los renders no traen canal alfa y no
   pueden traerlo — el muñeco es blanco y el fondo del archivo es un beige
   de luminancia 247 contra una cabeza de 249, asi que recortar por brillo
   se come la parte mas clara del muñeco. En vez de recortar, el fondo se
   lleva a blanco exacto y la landing lo funde con mix-blend-multiply:
   blanco por el color de la pagina devuelve ese mismo color, y la sombra
   de contacto se conserva en lugar de quedar cortada con tijera.
3. Recorta al contenido y exporta a WebP. Son degradados suaves: en PNG
   pesan ~470 KB cada uno, en WebP ~14 KB con la misma imagen.

Las coordenadas de cada logo estan fijas abajo, atadas a los archivos
concretos que llegaron. Si se regenera un personaje hay que volver a
medirlas — no se detectan solas.
"""

import os

from PIL import Image
import numpy as np


def _dilate(mask, n):
    for _ in range(n):
        m = mask.copy()
        m[1:] |= mask[:-1]; m[:-1] |= mask[1:]
        m[:, 1:] |= mask[:, :-1]; m[:, :-1] |= mask[:, 1:]
        mask = m
    return mask


def _border_connected(mask):
    """Lo oscuro que entra por la orilla del recorte: sombras, bordes del
    aparato, la mano del muñeco. No es la marca que se quiere borrar."""
    seed = np.zeros_like(mask)
    seed[0] |= mask[0]; seed[-1] |= mask[-1]
    seed[:, 0] |= mask[:, 0]; seed[:, -1] |= mask[:, -1]
    while True:
        grown = _dilate(seed, 1) & mask
        if grown.sum() == seed.sum():
            return seed
        seed = grown


def delogo(arr, box, dark_margin=10, light_margin=None, dilate=5, fit_margin=45, keep=None):
    """Borra una marca encerrada dentro de `box` reconstruyendo la
    superficie de abajo.

    La tapa o carcasa es un degradado suave, asi que se le ajusta una
    cuadratica por canal y se repinta con eso el area de la marca.
    Interpolar fila por fila tambien la quita, pero deja un fantasma
    bandeado: cada fila reconstruye su propio tramo y las costuras no
    coinciden entre filas.

    El descarte de lo conectado al borde va antes de engordar la mascara.
    Al reves, cinco dilataciones bastan para que el logo toque la sombra
    que entra por la orilla, los dos quedan en la misma pieza y se
    descarta todo."""
    x0, y0, x1, y1 = box
    roi = arr[y0:y1, x0:x1].astype(np.float64)
    lum = roi.mean(axis=2)
    base = np.median(lum)

    odd = lum < base - dark_margin
    if light_margin is not None:
        # Los logos grabados traen un bisel claro alrededor. Sin el, queda
        # un contorno fantasma justo donde estaba la marca. Lo brillante
        # del muñeco no se cuela porque entra por la orilla del recorte.
        odd |= lum > base + light_margin
    if keep is None:
        outside = _border_connected(odd)
        mask = _dilate(odd & ~outside, dilate) & ~outside
    else:
        # Cuando la marca queda pegada a otra cosa oscura — el canto del
        # aparato, la mano del muñeco — lo de "no toca el borde" ya no la
        # separa. `keep` acota a mano el rectangulo que se repinta, y el
        # ajuste sigue usando toda la region de alrededor.
        kx0, ky0, kx1, ky1 = keep
        sub = odd[ky0 - y0:ky1 - y0, kx0 - x0:kx1 - x0]
        # El mismo criterio de "no toca la orilla", pero medido contra la
        # caja: la linea de sombra entre el aparato y la mano entra por
        # abajo y se descarta, mientras que la marca queda encerrada.
        sub = sub & ~_border_connected(sub)
        inner = np.zeros_like(odd)
        inner[ky0 - y0:ky1 - y0, kx0 - x0:kx1 - x0] = sub
        mask = _dilate(inner, dilate)
        limit = np.zeros_like(odd)
        limit[ky0 - y0:ky1 - y0, kx0 - x0:kx1 - x0] = True
        mask &= limit
    if not mask.any():
        return arr, 0

    h, w, _ = roi.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    yn, xn = yy / max(h - 1, 1), xx / max(w - 1, 1)
    terms = [np.ones_like(xn), xn, yn, xn * yn, xn ** 2, yn ** 2]
    # El ajuste solo mira la propia superficie: si el recorte roza una mano
    # blanca del muñeco, esos pixeles arrastran la cuadratica y el parche
    # sale mas claro que el aparato.
    fit = (~mask) & (np.abs(lum - base) < fit_margin)
    A = np.stack([t[fit] for t in terms], axis=1)
    full = np.stack([t.ravel() for t in terms], axis=1)

    out = roi.copy()
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, roi[fit, c], rcond=None)
        out[:, :, c][mask] = (full @ coef).reshape(h, w)[mask]

    arr = arr.copy()
    arr[y0:y1, x0:x1] = np.clip(out, 0, 255).astype(np.uint8)
    return arr, int(mask.sum())


def soften(arr, box, radius=7, feather=6):
    """Disuelve una marca con un desenfoque local en vez de reconstruir la
    superficie. Es lo que queda cuando la marca toca otro objeto — en el
    celular el logo llega hasta el borde de la mano — y ninguna regla de
    conectividad puede separarlos: reconstruir repinta tambien el canto de
    la mano y deja un escalon recto. El desenfoque no inventa geometria,
    solo deja la forma ilegible, y la mascara difuminada evita que se note
    donde empieza."""
    from PIL import ImageFilter
    x0, y0, x1, y1 = box
    pad = radius * 3
    region = Image.fromarray(arr[y0 - pad:y1 + pad, x0 - pad:x1 + pad])
    blurred = np.array(region.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float64)
    base = np.array(region, dtype=np.float64)

    h, w = base.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    inside = np.minimum.reduce([xx - pad, yy - pad, (w - 1 - pad) - xx, (h - 1 - pad) - yy])
    alpha = np.clip((inside + feather) / (2.0 * feather), 0, 1)[..., None]

    out = arr.copy()
    out[y0 - pad:y1 + pad, x0 - pad:x1 + pad] = np.clip(
        base * (1 - alpha) + blurred * alpha, 0, 255
    ).astype(np.uint8)
    return out


def to_asset(arr, out_path, target_h=900, quality=90):
    """Normaliza el fondo a blanco, recorta al contenido y guarda WebP."""
    a = arr.astype(np.float32)
    h, w, _ = a.shape
    # El fondo es plano: la mediana del marco exterior lo describe sin que
    # ningun pixel del personaje entre en la cuenta.
    border = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3),
                             a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    out = np.clip(a * (255.0 / bg), 0, 255)

    ys, xs = np.where(out.min(axis=2) < 250)
    pad = 12
    y0, y1 = max(0, ys.min() - pad), min(h, ys.max() + 1 + pad)
    x0, x1 = max(0, xs.min() - pad), min(w, xs.max() + 1 + pad)
    crop = Image.fromarray(out.astype(np.uint8)).crop((x0, y0, x1, y1))
    crop = crop.resize((round(crop.width * target_h / crop.height), target_h), Image.LANCZOS)
    crop.save(out_path, quality=quality, method=6)
    return crop.size


# Cada entrada: archivo de origen -> id del agente, y como quitarle el logo.
# `delogo` reconstruye la superficie y es lo que se quiere siempre que se
# pueda. `soften` es el recurso para cuando la marca toca otro objeto y no
# hay forma de separarlas.
RENDERS = [
    ("a2412f5c-image.png", "estrategia",
     lambda a: delogo(a, (690, 615, 775, 735), dark_margin=10, dilate=5)[0]),
    ("d0cf5e01-image.png", "tendencias", None),
    ("6f99beb9-image.png", "creativo", None),
    ("bb435bde-image.png", "revisor",
     lambda a: delogo(a, (710, 565, 815, 675), dark_margin=25, light_margin=14, dilate=6)[0]),
    ("035bbb59-image.png", "publicacion",
     lambda a: soften(a, (755, 541, 782, 576), radius=12, feather=8)),
    ("d0b7b606-image.png", "respuestas", None),
    ("01d721d4-image.png", "resultados", None),
]


if __name__ == "__main__":
    import sys

    src_dir = sys.argv[1]
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "public", "agentes")
    os.makedirs(out_dir, exist_ok=True)
    for filename, agent_id, clean in RENDERS:
        arr = np.array(Image.open(os.path.join(src_dir, filename)).convert("RGB"))
        if clean is not None:
            arr = clean(arr)
        path = os.path.join(out_dir, f"{agent_id}.webp")
        size = to_asset(arr, path)
        print(f"{agent_id:12s} {size} {os.path.getsize(path) // 1024} KB")


def _fill_holes(mask):
    """Rellena los huecos interiores de una máscara.

    Las micas se detectan por su tinte, así que las pupilas —que son
    negras— salen como agujeros. Un reflejo real pasa por encima del ojo
    igual que por el resto del cristal, así que el hueco tiene que
    cerrarse o el destello aparecería mordido."""
    fuera = ~mask
    semilla = np.zeros_like(fuera)
    semilla[0] |= fuera[0]; semilla[-1] |= fuera[-1]
    semilla[:, 0] |= fuera[:, 0]; semilla[:, -1] |= fuera[:, -1]
    while True:
        crecido = semilla.copy()
        crecido[1:] |= semilla[:-1]; crecido[:-1] |= semilla[1:]
        crecido[:, 1:] |= semilla[:, :-1]; crecido[:, :-1] |= semilla[:, 1:]
        crecido &= fuera
        if crecido.sum() == semilla.sum():
            break
        semilla = crecido
    return ~semilla


def _borrar_pupilas(arr, micas, pupilas):
    """Quita las pupilas del cristal reconstruyendo el tinte de la mica.

    Se van del render porque tienen que moverse: son lo que hace que el
    personaje siga al cursor, y algo pintado en la imagen no puede seguir
    a nada. Se vuelven a dibujar en el navegador, encima.

    Cada mica se ajusta por separado — reciben luz distinta, y una sola
    superficie para las dos deja un parche visiblemente más claro en una
    de ellas."""
    salida = arr.astype(np.float64).copy()
    ys, xs = np.where(micas)
    medio = (xs.min() + xs.max()) / 2
    for lado in (xs < medio, xs >= medio):
        lente = np.zeros_like(micas)
        lente[ys[lado], xs[lado]] = True
        limpio = lente & ~pupilas
        hueco = lente & pupilas
        if not hueco.any():
            continue
        yy, xx = np.mgrid[0:arr.shape[0], 0:arr.shape[1]].astype(np.float64)
        yn = (yy - ys[lado].mean()) / 100.0
        xn = (xx - xs[lado].mean()) / 100.0
        terminos = [np.ones_like(xn), xn, yn, xn * yn, xn ** 2, yn ** 2]
        A = np.stack([t[limpio] for t in terminos], axis=1)
        B = np.stack([t[hueco] for t in terminos], axis=1)
        for c in range(3):
            coef, *_ = np.linalg.lstsq(A, arr[limpio, c], rcond=None)
            salida[hueco, c] = B @ coef
    return np.clip(salida, 0, 255)


def hero(src, out_dir, target_h=1400):
    """Prepara el render del hero y, aparte, la máscara de las micas.

    El destello de los lentes se dibuja en el navegador para que se
    deslice al inclinar; un brillo pintado en el render se queda quieto y
    delata el truco. Para recortarlo exactamente a la forma de los
    cristales hace falta su silueta, y se saca de aquí: las micas son lo
    único de la imagen con tinte azul-verde, ni el cuerpo blanco ni el
    armazón negro lo tienen.

    Las dos salidas comparten recorte y escala; si se calcularan por
    separado, la máscara quedaría corrida unos píxeles sobre la cara."""
    a = np.array(Image.open(src).convert("RGB")).astype(np.float32)
    h, w, _ = a.shape

    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    micas = _fill_holes((b - r > 12) & (g > 140) & (b > 150))
    pupilas = micas & (a.mean(axis=2) < 110)
    # El umbral deja fuera el antialias del borde, que es más claro que la
    # pupila pero más oscuro que la mica; sin engordar la máscara queda un
    # contorno punteado donde estaba el ojo.
    geometria = pupilas
    pupilas = _dilate(pupilas, 4) & micas
    a = _borrar_pupilas(a, micas, pupilas)

    borde = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3),
                            a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    normalizada = np.clip(a * (255.0 / np.median(borde, axis=0)), 0, 255)

    ys, xs = np.where(normalizada.min(axis=2) < 250)
    pad = 10
    caja = (max(0, xs.min() - pad), max(0, ys.min() - pad),
            min(w, xs.max() + 1 + pad), min(h, ys.max() + 1 + pad))
    ancho = round((caja[2] - caja[0]) * target_h / (caja[3] - caja[1]))

    Image.fromarray(normalizada.astype(np.uint8)).crop(caja).resize(
        (ancho, target_h), Image.LANCZOS
    ).save(os.path.join(out_dir, "protagonista.webp"), quality=92, method=6)

    plano = np.zeros((h, w, 4), dtype=np.uint8)
    plano[..., :3] = 255
    plano[..., 3] = micas * 255
    Image.fromarray(plano).crop(caja).resize((ancho, target_h), Image.LANCZOS).save(
        os.path.join(out_dir, "protagonista-lentes.png"), optimize=True
    )

    # Geometría de las pupilas en porcentaje del recorte final, para
    # colocarlas por CSS. En porcentaje y no en píxeles porque la imagen se
    # muestra a alturas distintas según el ancho de pantalla.
    py, px = np.where(geometria)
    medio = (px.min() + px.max()) / 2
    ojos = []
    for lado in (px < medio, px >= medio):
        X, Y = px[lado], py[lado]
        ojos.append({
            "x": round((X.mean() - caja[0]) / (caja[2] - caja[0]) * 100, 3),
            "y": round((Y.mean() - caja[1]) / (caja[3] - caja[1]) * 100, 3),
            "rx": round((X.max() - X.min()) / 2 / (caja[2] - caja[0]) * 100, 3),
            "ry": round((Y.max() - Y.min()) / 2 / (caja[3] - caja[1]) * 100, 3),
        })
    return (ancho, target_h), int(micas.sum()), ojos
