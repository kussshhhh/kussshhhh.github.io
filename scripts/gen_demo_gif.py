from PIL import Image, ImageDraw, ImageFont
import math

W, H = 680, 380
BG = (250, 247, 242)
TEXT = (46, 43, 38)
TEXT_FAINT = (140, 133, 120)
ACCENT2 = (109, 79, 209)
DIAG_POS = (92, 126, 153)
DIAG_NEG = (184, 114, 79)
DIAG_YOU = (95, 143, 110)

FONT_DIR = "/Users/kussshhhh/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/fonts"
bold = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 28)
regular = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Regular.ttf", 18)
small = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Regular.ttf", 15)
smallbold = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 15)
bigw = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 40)

ORIGIN = (220, 220)
SCALE = 3.6
AXIS_END_X = 620
D, A = 23.4, 4.8
THRESHOLD = D + A

segments = [
    ("ad engagement", -27.2, -60),
    ("shareholder profit", -18.8, 55),
    ("gov't compliance", 12.3, 85),
    ("other users", 33.0, -60),
]


def draw_static(d):
    d.text((80, 40), "in favour of local ai", font=bold, fill=ACCENT2)
    d.text((80, 78), "does your local ai clear the frontier lab's net pull?", font=regular, fill=TEXT)

    ox, oy = ORIGIN
    d.line([(ox, oy), (AXIS_END_X, oy)], fill=(210, 205, 195), width=2)
    d.line([(ox, oy - 6), (ox, oy + 6)], fill=TEXT_FAINT, width=1)

    for name, val, offset_y in segments:
        x = ox + val * SCALE
        color = DIAG_POS if val >= 0 else DIAG_NEG
        r = 6
        d.ellipse([x - r, oy - r, x + r, oy + r], fill=color)
        ly = oy + offset_y
        d.line([(x, oy), (x, ly + (10 if offset_y > 0 else -4))], fill=color, width=1)
        label = f"{name}  {'+' if val >= 0 else ''}{val:.1f}"
        tx = max(6, x - 10)
        d.text((tx, ly if offset_y > 0 else ly - 16), label, font=small, fill=TEXT_FAINT)

    tick_x = ox + THRESHOLD * SCALE
    d.line([(tick_x, oy - 22), (tick_x, oy + 22)], fill=DIAG_NEG, width=2)
    label = f"D+A = {THRESHOLD:.1f}"
    tw = d.textlength(label, font=smallbold)
    d.text((tick_x - tw / 2, oy - 42), label, font=smallbold, fill=DIAG_NEG)


def draw_frame(l_val, win):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    draw_static(d)
    ox, oy = ORIGIN

    lx = ox + l_val * SCALE
    d.line([(ox, oy), (lx, oy)], fill=DIAG_YOU, width=6)
    r = 6
    d.ellipse([lx - r, oy - r, lx + r, oy + r], fill=DIAG_YOU)
    llabel = f"l = {l_val:.1f}"
    d.text((lx + 10, oy - 10), llabel, font=smallbold, fill=DIAG_YOU)

    if win:
        d.text((AXIS_END_X - 46, oy - 78), "w", font=bigw, fill=DIAG_YOU)
        cap = f"l ({l_val:.1f}) clears D+A ({THRESHOLD:.1f}) — winning."
    else:
        cap = f"l ({l_val:.1f}) is short of D+A ({THRESHOLD:.1f})."
        tw = d.textlength("possibility of being fucked", font=smallbold)
        d.text((AXIS_END_X - tw, oy - 46), "possibility of being fucked", font=smallbold, fill=DIAG_NEG)

    d.text((80, 340), cap, font=regular, fill=TEXT)
    return img


frames = []
durations = []

# sweep l from 0 up to just past threshold
sweep_vals = [round(v, 1) for v in [i * 1.5 for i in range(0, 24)]]  # 0..34.5
for v in sweep_vals:
    win = v > THRESHOLD
    frames.append(draw_frame(v, win))
    durations.append(60)

# hold on the win frame
final_val = sweep_vals[-1]
for _ in range(14):
    frames.append(draw_frame(final_val, True))
    durations.append(90)

out_path = "/Users/kussshhhh/cooking/kussshhhh.github.io/articles/win-demo.gif"
frames[0].save(
    out_path,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    optimize=True,
)
print("saved", out_path, len(frames), "frames")
