from PIL import Image, ImageDraw, ImageFont
import math
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from gen_demo_gif import CONTRIBS, K_P, K_ANGLE, K_C, N, D, A, THRESHOLD, draw_arrow  # noqa: E402

W, H = 1200, 630
BG = (250, 247, 242)
TEXT = (46, 43, 38)
TEXT_FAINT = (140, 133, 120)
ACCENT2 = (109, 79, 209)
DIAG_POS = (92, 126, 153)
DIAG_NEG = (184, 114, 79)
DIAG_YOU = (95, 143, 110)

FONT_DIR = "/Users/kussshhhh/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/fonts"
bold = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 64)
regular = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Regular.ttf", 26)
small = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Regular.ttf", 15)
smallbold = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 15)
bigw = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 60)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

d.text((70, 60), "in favour of", font=bold, fill=ACCENT2)
d.text((70, 140), "local ai", font=bold, fill=ACCENT2)

lines = [
    "a model for why democratizing capable models beats",
    "concentrating them, argued through incentives",
    "instead of intuition.",
]
y = 250
for line in lines:
    d.text((70, y), line, font=regular, fill=TEXT)
    y += 36

# reuse the real vector geometry from the demo gif, laid out for a wide card
VORIGIN = (280, 480)
VSCALE = 1.55
VEC_MAX = 90

for name, q, c, angle, val in CONTRIBS:
    rad = math.radians(angle)
    ux, uy = math.cos(rad), -math.sin(rad)
    length = min(q * VSCALE, VEC_MAX)
    tip = (VORIGIN[0] + length * ux, VORIGIN[1] + length * uy)
    color = DIAG_POS if c >= 0 else DIAG_NEG
    draw_arrow(d, VORIGIN[0], VORIGIN[1], tip[0], tip[1], color, width=3, head=7)
    d.line([(tip[0], tip[1]), (tip[0], VORIGIN[1])], fill=color, width=1)
    d.ellipse([tip[0] - 3, VORIGIN[1] - 3, tip[0] + 3, VORIGIN[1] + 3], fill=color)

for r in (28, 56, 84):
    d.ellipse(
        [VORIGIN[0] - r, VORIGIN[1] - r, VORIGIN[0] + r, VORIGIN[1] + r],
        outline=(224, 219, 209), width=1
    )
d.ellipse([VORIGIN[0] - 3, VORIGIN[1] - 3, VORIGIN[0] + 3, VORIGIN[1] + 3], fill=TEXT_FAINT)

# the race lane: axis, threshold tick, l winning, big w — the card's focal point
RORIGIN = (430, 480)
RAXIS_END_X = 1140
d.line([(RORIGIN[0], RORIGIN[1]), (RAXIS_END_X, RORIGIN[1])], fill=(210, 205, 195), width=2)

tick_x = RORIGIN[0] + THRESHOLD * 5.2
d.line([(tick_x, RORIGIN[1] - 26), (tick_x, RORIGIN[1] + 26)], fill=DIAG_NEG, width=2)
label = f"D+A = {THRESHOLD:.1f}"
tw = d.textlength(label, font=smallbold)
d.text((tick_x - tw / 2, RORIGIN[1] - 48), label, font=smallbold, fill=DIAG_NEG)

l_val = 12.0
lx = RORIGIN[0] + l_val * 5.2
draw_arrow(d, RORIGIN[0], RORIGIN[1], lx, RORIGIN[1], DIAG_YOU, width=7, head=10)
d.text((lx - 30, RORIGIN[1] + 16), f"l = {l_val:.0f}", font=smallbold, fill=DIAG_YOU)

tag = "possibility of being fucked"
tagfont = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 32)
tw = d.textlength(tag, font=tagfont)
d.text((RAXIS_END_X - tw, RORIGIN[1] - 68), tag, font=tagfont, fill=DIAG_NEG)

# footer
d.text((70, 570), "kussshhhh.github.io/articles", font=small, fill=(120, 115, 105))

out_path = "/Users/kussshhhh/cooking/kussshhhh.github.io/articles/og-image.png"
img.save(out_path)
print("saved", out_path)
