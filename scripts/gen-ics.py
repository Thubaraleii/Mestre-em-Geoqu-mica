# Gera os dados da tabela cronoestratigráfica a partir da carta oficial da ICS (v2023/09).
# Uso: python -I scripts/gen-ics.py <ChronostratChart2023-09.pdf> <saida.json>
# Os nomes e as idades de base foram transcritos da carta; as cores são lidas do próprio PDF
# (retângulo preenchido sob o nome de cada andar). A carta está em https://stratigraphy.org/ICSchart/
import json
import sys

import pymupdf

pdf, out = sys.argv[1], sys.argv[2]

# Eon|Era|Periodo|Epoca|Andar|base_Ma|erro|aprox   (a idade de base de cada andar; ~ = idade aproximada na carta)
DATA = """
Phanerozoic|Cenozoic|Quaternary|Holocene|Meghalayan|0.0042||
Phanerozoic|Cenozoic|Quaternary|Holocene|Northgrippian|0.0082||
Phanerozoic|Cenozoic|Quaternary|Holocene|Greenlandian|0.0117||
Phanerozoic|Cenozoic|Quaternary|Pleistocene|Upper Pleistocene|0.129||
Phanerozoic|Cenozoic|Quaternary|Pleistocene|Chibanian|0.774||
Phanerozoic|Cenozoic|Quaternary|Pleistocene|Calabrian|1.80||
Phanerozoic|Cenozoic|Quaternary|Pleistocene|Gelasian|2.58||
Phanerozoic|Cenozoic|Neogene|Pliocene|Piacenzian|3.600||
Phanerozoic|Cenozoic|Neogene|Pliocene|Zanclean|5.333||
Phanerozoic|Cenozoic|Neogene|Miocene|Messinian|7.246||
Phanerozoic|Cenozoic|Neogene|Miocene|Tortonian|11.63||
Phanerozoic|Cenozoic|Neogene|Miocene|Serravallian|13.82||
Phanerozoic|Cenozoic|Neogene|Miocene|Langhian|15.98||
Phanerozoic|Cenozoic|Neogene|Miocene|Burdigalian|20.44||
Phanerozoic|Cenozoic|Neogene|Miocene|Aquitanian|23.03||
Phanerozoic|Cenozoic|Paleogene|Oligocene|Chattian|27.82||
Phanerozoic|Cenozoic|Paleogene|Oligocene|Rupelian|33.9||
Phanerozoic|Cenozoic|Paleogene|Eocene|Priabonian|37.71||
Phanerozoic|Cenozoic|Paleogene|Eocene|Bartonian|41.2||
Phanerozoic|Cenozoic|Paleogene|Eocene|Lutetian|47.8||
Phanerozoic|Cenozoic|Paleogene|Eocene|Ypresian|56.0||
Phanerozoic|Cenozoic|Paleogene|Paleocene|Thanetian|59.2||
Phanerozoic|Cenozoic|Paleogene|Paleocene|Selandian|61.6||
Phanerozoic|Cenozoic|Paleogene|Paleocene|Danian|66.0||
Phanerozoic|Mesozoic|Cretaceous|Upper|Maastrichtian|72.1|0.2|
Phanerozoic|Mesozoic|Cretaceous|Upper|Campanian|83.6|0.2|
Phanerozoic|Mesozoic|Cretaceous|Upper|Santonian|86.3|0.5|
Phanerozoic|Mesozoic|Cretaceous|Upper|Coniacian|89.8|0.3|
Phanerozoic|Mesozoic|Cretaceous|Upper|Turonian|93.9||
Phanerozoic|Mesozoic|Cretaceous|Upper|Cenomanian|100.5||
Phanerozoic|Mesozoic|Cretaceous|Lower|Albian|113.0||~
Phanerozoic|Mesozoic|Cretaceous|Lower|Aptian|121.4||~
Phanerozoic|Mesozoic|Cretaceous|Lower|Barremian|125.77||
Phanerozoic|Mesozoic|Cretaceous|Lower|Hauterivian|132.6||~
Phanerozoic|Mesozoic|Cretaceous|Lower|Valanginian|139.8||~
Phanerozoic|Mesozoic|Cretaceous|Lower|Berriasian|145.0||~
Phanerozoic|Mesozoic|Jurassic|Upper|Tithonian|149.2|0.7|
Phanerozoic|Mesozoic|Jurassic|Upper|Kimmeridgian|154.8|0.8|
Phanerozoic|Mesozoic|Jurassic|Upper|Oxfordian|161.5|1.0|
Phanerozoic|Mesozoic|Jurassic|Middle|Callovian|165.3|1.1|
Phanerozoic|Mesozoic|Jurassic|Middle|Bathonian|168.2|1.2|
Phanerozoic|Mesozoic|Jurassic|Middle|Bajocian|170.9|0.8|
Phanerozoic|Mesozoic|Jurassic|Middle|Aalenian|174.7|0.8|
Phanerozoic|Mesozoic|Jurassic|Lower|Toarcian|184.2|0.3|
Phanerozoic|Mesozoic|Jurassic|Lower|Pliensbachian|192.9|0.3|
Phanerozoic|Mesozoic|Jurassic|Lower|Sinemurian|199.5|0.3|
Phanerozoic|Mesozoic|Jurassic|Lower|Hettangian|201.4|0.2|
Phanerozoic|Mesozoic|Triassic|Upper|Rhaetian|208.5||~
Phanerozoic|Mesozoic|Triassic|Upper|Norian|227||~
Phanerozoic|Mesozoic|Triassic|Upper|Carnian|237||~
Phanerozoic|Mesozoic|Triassic|Middle|Ladinian|242||~
Phanerozoic|Mesozoic|Triassic|Middle|Anisian|247.2||
Phanerozoic|Mesozoic|Triassic|Lower|Olenekian|251.2||
Phanerozoic|Mesozoic|Triassic|Lower|Induan|251.902|0.024|
Phanerozoic|Paleozoic|Permian|Lopingian|Changhsingian|254.14|0.07|
Phanerozoic|Paleozoic|Permian|Lopingian|Wuchiapingian|259.51|0.21|
Phanerozoic|Paleozoic|Permian|Guadalupian|Capitanian|264.28|0.16|
Phanerozoic|Paleozoic|Permian|Guadalupian|Wordian|266.9|0.4|
Phanerozoic|Paleozoic|Permian|Guadalupian|Roadian|273.01|0.14|
Phanerozoic|Paleozoic|Permian|Cisuralian|Kungurian|283.5|0.6|
Phanerozoic|Paleozoic|Permian|Cisuralian|Artinskian|290.1|0.26|
Phanerozoic|Paleozoic|Permian|Cisuralian|Sakmarian|293.52|0.17|
Phanerozoic|Paleozoic|Permian|Cisuralian|Asselian|298.9|0.15|
Phanerozoic|Paleozoic|Carboniferous|Pennsylvanian|Gzhelian|303.7|0.1|
Phanerozoic|Paleozoic|Carboniferous|Pennsylvanian|Kasimovian|307.0|0.1|
Phanerozoic|Paleozoic|Carboniferous|Pennsylvanian|Moscovian|315.2|0.2|
Phanerozoic|Paleozoic|Carboniferous|Pennsylvanian|Bashkirian|323.2|0.4|
Phanerozoic|Paleozoic|Carboniferous|Mississippian|Serpukhovian|330.9|0.2|
Phanerozoic|Paleozoic|Carboniferous|Mississippian|Visean|346.7|0.4|
Phanerozoic|Paleozoic|Carboniferous|Mississippian|Tournaisian|358.9|0.4|
Phanerozoic|Paleozoic|Devonian|Upper|Famennian|372.2|1.6|
Phanerozoic|Paleozoic|Devonian|Upper|Frasnian|382.7|1.6|
Phanerozoic|Paleozoic|Devonian|Middle|Givetian|387.7|0.8|
Phanerozoic|Paleozoic|Devonian|Middle|Eifelian|393.3|1.2|
Phanerozoic|Paleozoic|Devonian|Lower|Emsian|407.6|2.6|
Phanerozoic|Paleozoic|Devonian|Lower|Pragian|410.8|2.8|
Phanerozoic|Paleozoic|Devonian|Lower|Lochkovian|419.2|3.2|
Phanerozoic|Paleozoic|Silurian|Pridoli|Pridoli|423.0|2.3|
Phanerozoic|Paleozoic|Silurian|Ludlow|Ludfordian|425.6|0.9|
Phanerozoic|Paleozoic|Silurian|Ludlow|Gorstian|427.4|0.5|
Phanerozoic|Paleozoic|Silurian|Wenlock|Homerian|430.5|0.7|
Phanerozoic|Paleozoic|Silurian|Wenlock|Sheinwoodian|433.4|0.8|
Phanerozoic|Paleozoic|Silurian|Llandovery|Telychian|438.5|1.1|
Phanerozoic|Paleozoic|Silurian|Llandovery|Aeronian|440.8|1.2|
Phanerozoic|Paleozoic|Silurian|Llandovery|Rhuddanian|443.8|1.5|
Phanerozoic|Paleozoic|Ordovician|Upper|Hirnantian|445.2|1.4|
Phanerozoic|Paleozoic|Ordovician|Upper|Katian|453.0|0.7|
Phanerozoic|Paleozoic|Ordovician|Upper|Sandbian|458.4|0.9|
Phanerozoic|Paleozoic|Ordovician|Middle|Darriwilian|467.3|1.1|
Phanerozoic|Paleozoic|Ordovician|Middle|Dapingian|470.0|1.4|
Phanerozoic|Paleozoic|Ordovician|Lower|Floian|477.7|1.4|
Phanerozoic|Paleozoic|Ordovician|Lower|Tremadocian|485.4|1.9|
Phanerozoic|Paleozoic|Cambrian|Furongian|Stage 10|489.5||~
Phanerozoic|Paleozoic|Cambrian|Furongian|Jiangshanian|494||~
Phanerozoic|Paleozoic|Cambrian|Furongian|Paibian|497||~
Phanerozoic|Paleozoic|Cambrian|Miaolingian|Guzhangian|500.5||~
Phanerozoic|Paleozoic|Cambrian|Miaolingian|Drumian|504.5||~
Phanerozoic|Paleozoic|Cambrian|Miaolingian|Wuliuan|509||~
Phanerozoic|Paleozoic|Cambrian|Series 2|Stage 4|514||~
Phanerozoic|Paleozoic|Cambrian|Series 2|Stage 3|521||~
Phanerozoic|Paleozoic|Cambrian|Terreneuvian|Stage 2|529||~
Phanerozoic|Paleozoic|Cambrian|Terreneuvian|Fortunian|538.8|0.2|
Precambrian|Proterozoic|Neoproterozoic||Ediacaran|635||~
Precambrian|Proterozoic|Neoproterozoic||Cryogenian|720||~
Precambrian|Proterozoic|Neoproterozoic||Tonian|1000||
Precambrian|Proterozoic|Mesoproterozoic||Stenian|1200||
Precambrian|Proterozoic|Mesoproterozoic||Ectasian|1400||
Precambrian|Proterozoic|Mesoproterozoic||Calymmian|1600||
Precambrian|Proterozoic|Paleoproterozoic||Statherian|1800||
Precambrian|Proterozoic|Paleoproterozoic||Orosirian|2050||
Precambrian|Proterozoic|Paleoproterozoic||Rhyacian|2300||
Precambrian|Proterozoic|Paleoproterozoic||Siderian|2500||
Precambrian|Archean|Neoarchean|||2800||
Precambrian|Archean|Mesoarchean|||3200||
Precambrian|Archean|Paleoarchean|||3600||
Precambrian|Archean|Eoarchean|||4031|3|
Precambrian|Hadean||||4567||
"""

doc = pymupdf.open(pdf)
page = doc[0]
fills = []
for d in page.get_drawings():
    r = d["rect"]
    if d.get("fill") and 20 < r.width < 400 and r.height > 6:
        fills.append((r, d["fill"]))


def color_for(name):
    best = None
    for h in page.search_for(name):
        c = pymupdf.Point((h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2)
        for r, f in fills:
            if r.contains(c):
                area = r.width * r.height
                if best is None or area < best[0]:
                    best = (area, f)
    if not best:
        return None
    return "#%02x%02x%02x" % tuple(round(v * 255) for v in best[1])


def color_at(x, y):
    best = None
    for r, f in fills:
        if r.contains(pymupdf.Point(x, y)):
            area = r.width * r.height
            if best is None or area < best[0]:
                best = (area, f)
    return None if not best else "#%02x%02x%02x" % tuple(round(v * 255) for v in best[1])


# subeons do Arqueano: nomes hifenizados no PDF ("Neo-/archean"); a cor vem da coluna colorida ao lado, por posição (pt)
ARCHEAN_POS = {"Neoarchean": (1062, 412), "Mesoarchean": (1062, 448), "Paleoarchean": (1062, 484), "Eoarchean": (1062, 519)}

rows = []
for line in DATA.strip().splitlines():
    eon, era, per, ep, st, base, err, apx = line.split("|")
    key = {"Upper Pleistocene": "Upper"}.get(st, st) or per or era
    col = color_for(key) or (color_at(*ARCHEAN_POS[per]) if per in ARCHEAN_POS else None)
    rows.append(dict(eon=eon, era=era, period=per, epoch=ep, stage=st, base=float(base),
                     err=float(err) if err else None, approx=bool(apx), color=col))

print("linhas:", len(rows), "| sem cor:", [r["stage"] or r["period"] or r["era"] for r in rows if not r["color"]])
json.dump(rows, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
