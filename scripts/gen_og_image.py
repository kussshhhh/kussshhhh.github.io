from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (250, 247, 242)
TEXT = (46, 43, 38)
TEXT_FAINT = (30, 27, 23)
ACCENT2 = (109, 79, 209)   # purple, matches --accent2 light theme
ACCENT = (14, 124, 143)    # teal, matches --accent light theme
DIAG_POS = (92, 126, 153)
DIAG_NEG = (184, 114, 79)
DIAG_YOU = (95, 143, 110)

FONT_DIR = "/Users/kussshhhh/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/fonts"
bold = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 72)
regular = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Regular.ttf", 30)
small = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Regular.ttf", 24)
smallbold = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 24)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# title
d.text((80, 120), "in favour of", font=bold, fill=ACCENT2)
d.text((80, 205), "local ai", font=bold, fill=ACCENT2)

# subtitle, wrapped manually
lines = [
    "a model for why democratizing capable models beats",
    "concentrating them, argued through incentives",
    "instead of intuition.",
]
y = 320
for line in lines:
    d.text((80, y), line, font=regular, fill=TEXT)
    y += 40

# decorative mini diagram: axis + dots + big W, echoing the article's own widget
axis_y = 520
axis_x0, axis_x1 = 80, 900
d.line([(axis_x0, axis_y), (axis_x1, axis_y)], fill=(200, 195, 185), width=2)
d.line([(axis_x1, axis_y - 8), (axis_x1 + 14, axis_y), (axis_x1, axis_y + 8)], fill=TEXT_FAINT)

dots = [
    (200, -24, DIAG_NEG, "-27.2"),
    (320, 18, DIAG_POS, "+12.3"),
    (420, -14, DIAG_NEG, "-18.8"),
    (540, 22, DIAG_POS, "+10.3"),
]
for dx, dy, color, label in dots:
    cx = axis_x0 + dx
    cy = axis_y + dy
    r = 8
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)

# the "l" line, winning, in diag-you green + big W
d.line([(axis_x0, axis_y), (axis_x0 + 620, axis_y)], fill=DIAG_YOU, width=6)
d.ellipse([(axis_x0 + 614, axis_y - 8), (axis_x0 + 630, axis_y + 8)], fill=DIAG_YOU)
d.text((940, axis_y - 46), "w", font=ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 46), fill=DIAG_YOU)

# footer
d.text((80, 570), "kussshhhh.github.io/articles", font=small, fill=(120, 115, 105))

img.save("/Users/kussshhhh/cooking/kussshhhh.github.io/articles/og-image.png")
print("saved")
