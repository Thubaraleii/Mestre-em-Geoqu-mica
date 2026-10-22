# Extrai a geometria do TAS exportado pelo GCDkit (implementação independente de Le Maitre et al. 1989)
# para servir de referência de validação dos polígonos do app.
# Uso: python -I scripts/extract-gcdkit-tas.py "<TAS Volcanic (Le Maitre et al_ 1989).pdf>" tests/fixtures/tas-gcdkit.json
import json
import re
import sys

import pymupdf

pdf, out = sys.argv[1], sys.argv[2]
page = pymupdf.open(pdf)[0]

# --- calibração dos eixos pelos rótulos numéricos (centro do texto <-> valor) ---
words = page.get_text("words")
num = re.compile(r"^-?\d+(\.\d+)?$")
xs, ys = [], []
for x0, y0, x1, y1, w, *_ in words:
    if not num.match(w):
        continue
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    v = float(w)
    if v >= 35:
        xs.append((cx, cy, v))  # rótulos do eixo x: 35 a 80 (SiO2)
    elif v <= 15 and cx < 45:
        ys.append((cx, cy, v))  # rótulos do eixo y: 0 a 15 (Na2O + K2O), à esquerda


def fit(pairs):  # mínimos quadrados: valor = a * posição + b
    n = len(pairs)
    sp = sum(p for p, _ in pairs); sv = sum(v for _, v in pairs)
    spp = sum(p * p for p, _ in pairs); spv = sum(p * v for p, v in pairs)
    a = (n * spv - sp * sv) / (n * spp - sp * sp)
    return a, (sv - a * sp) / n


ax, bx = fit([(cx, v) for cx, _, v in xs])
ay, by = fit([(cy, v) for _, cy, v in ys])
X = lambda px: round(ax * px + bx, 3)
Y = lambda py: round(ay * py + by, 3)

# resíduo da calibração (deve ser ~0)
res_x = max(abs(ax * cx + bx - v) for cx, _, v in xs)
res_y = max(abs(ay * cy + by - v) for _, cy, v in ys)

segments = []
BOUNDARY = (0.0, 0.0, 0.0)  # fronteiras de campo: preto sólido; a grade é cinza claro tracejado; cinza médio = moldura e marcas; vermelho/azul = amostras
for d in page.get_drawings():
    col = tuple(round(c, 2) for c in d["color"]) if d.get("color") else None
    if col != BOUNDARY or d.get("dashes") not in (None, "[] 0"):
        continue
    for it in d["items"]:
        if it[0] == "l":
            p, q = it[1], it[2]
            segments.append([X(p.x), Y(p.y), X(q.x), Y(q.y)])
        elif it[0] == "qu":  # quadrilátero (campos inclinados): ul, ur, ll, lr -> contorno ul-ur-lr-ll
            q = it[1]
            ring = [q.ul, q.ur, q.lr, q.ll]
            for a, b in zip(ring, ring[1:] + ring[:1]):
                segments.append([X(a.x), Y(a.y), X(b.x), Y(b.y)])

names = ["Picrobasalt", "Basalt", "Basaltic andesite", "Andesite", "Dacite", "Rhyolite", "Trachybasalt", "Basaltic Trachyandesite", "Trachyandesite",
         "Trachyte", "Trachydacite", "Tephrite", "Basanite", "Phonotephrite", "Tephriphonolite", "Phonolite", "Foidite"]
lines = {}
for x0, y0, x1, y1, w, block, ln, wn in words:
    lines.setdefault((block, ln), []).append((x0, y0, x1, y1, w))
labels = []
for ws in lines.values():
    text = " ".join(t[4] for t in sorted(ws, key=lambda t: t[0]))
    if any(n.split()[0] in text for n in names) and not num.match(text):
        cx = (min(t[0] for t in ws) + max(t[2] for t in ws)) / 2
        cy = (min(t[1] for t in ws) + max(t[3] for t in ws)) / 2
        labels.append({"text": text, "x": X(cx), "y": Y(cy)})

json.dump({"source": "GCDkit TAS Volcanic (Le Maitre et al. 1989), exportado pelo usuário", "calibration_residual": [round(res_x, 4), round(res_y, 4)],
           "segments": segments, "labels": labels}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print("segmentos:", len(segments), "| rótulos:", len(labels), "| resíduo da calibração (x, y):", round(res_x, 4), round(res_y, 4))
for l in labels:
    print(" ", l)
