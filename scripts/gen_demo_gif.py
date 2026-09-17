from PIL import Image, ImageDraw, ImageFont
import math

W, H = 700, 560
BG = (250, 247, 242)
TEXT = (46, 43, 38)
TEXT_FAINT = (140, 133, 120)
ACCENT2 = (109, 79, 209)
DIAG_POS = (92, 126, 153)
DIAG_NEG = (184, 114, 79)
DIAG_YOU = (95, 143, 110)

FONT_DIR = "/Users/kussshhhh/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/fonts"
bold = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 26)
regular = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Regular.ttf", 16)
small = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Regular.ttf", 13)
smallbold = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 13)
bigw = ImageFont.truetype(f"{FONT_DIR}/Inconsolata-Bold.ttf", 36)

N = 100
K_P, K_ANGLE = 0.05, 15

SEGMENTS = [
    ("ad engagement", 0.30, 155),
    ("gov't compliance", 0.15, 35),
    ("other users", 0.30, -70),
    ("shareholder profit", 0.20, -160),
]

VORIGIN = (260, 150)
VSCALE = 1.7
VEC_MAX = 88
VAXIS_END_X = 640

RORIGIN = (70, 400)
RSCALE = 3.0
RAXIS_END_X = 640


def cos(deg):
    return math.cos(math.radians(deg))


def sin(deg):
    return math.sin(math.radians(deg))


def contribs():
    out = []
    for name, p, angle in SEGMENTS:
        c = cos(angle)
        out.append((name, p * N, c, angle, p * N * c))
    return out


CONTRIBS = contribs()
RAW_D = sum(v for *_, v in CONTRIBS)
D = abs(RAW_D)
K_C = cos(K_ANGLE)
A = K_P * N * K_C
THRESHOLD = D + A


def draw_arrow(d, x0, y0, x1, y1, color, width=3, head=7):
    d.line([(x0, y0), (x1, y1)], fill=color, width=width)
    ang = math.atan2(y1 - y0, x1 - x0)
    for side in (1, -1):
        a2 = ang + side * math.radians(28)
        hx = x1 - head * math.cos(a2)
        hy = y1 - head * math.sin(a2)
        d.line([(x1, y1), (hx, hy)], fill=color, width=width)


def draw_vector_band(d, l_val):
    ox, oy = VORIGIN
    d.text((30, 26), "in favour of local ai", font=bold, fill=ACCENT2)
    d.text((30, 62), "each segment's push, projected onto your axis", font=regular, fill=TEXT)

    # guide circles
    for r in (28, 56, 84):
        d.ellipse([ox - r, oy - r, ox + r, oy + r], outline=(224, 219, 209), width=1)

    draw_arrow(d, ox, oy, VAXIS_END_X - 10, oy, TEXT, width=2, head=8)
    d.text((VAXIS_END_X + 6, oy - 9), "â (you)", font=smallbold, fill=TEXT)
    d.ellipse([ox - 3, oy - 3, ox + 3, oy + 3], fill=TEXT_FAINT)

    for name, q, c, angle, val in CONTRIBS:
        rad = math.radians(angle)
        ux, uy = math.cos(rad), -math.sin(rad)
        length = min(q * VSCALE, VEC_MAX)
        tip = (ox + length * ux, oy + length * uy)
        color = DIAG_POS if c >= 0 else DIAG_NEG
        draw_arrow(d, ox, oy, tip[0], tip[1], color, width=3, head=7)
        # true perpendicular projection drop
        d.line([(tip[0], tip[1]), (tip[0], oy)], fill=color, width=1)
        d.ellipse([tip[0] - 3, oy - 3, tip[0] + 3, oy + 3], fill=color)
        lx = tip[0] + ux * 14
        ly = tip[1] + uy * 14
        anchor_left = ux < -0.2
        label = f"{name} {val:+.1f}"
        tw = d.textlength(label, font=small)
        d.text((lx - tw if anchor_left else lx, ly - 6), label, font=small, fill=TEXT_FAINT)

    # you (k) vector, grows with l
    k_len = min(K_P * N * VSCALE + l_val * 0.6, VEC_MAX)
    krad = math.radians(K_ANGLE)
    kux, kuy = math.cos(krad), -math.sin(krad)
    ktip = (ox + k_len * kux, oy + k_len * kuy)
    draw_arrow(d, ox, oy, ktip[0], ktip[1], DIAG_YOU, width=4, head=8)
    d.line([(ktip[0], ktip[1]), (ktip[0], oy)], fill=DIAG_YOU, width=1)
    label = f"you + l: {K_P * N * K_C + l_val:+.1f}"
    tw = d.textlength(label, font=smallbold)
    d.text((ox + 40 - tw / 2, oy + 20), label, font=smallbold, fill=DIAG_YOU)


def draw_race_band(d, l_val, win):
    ox, oy = RORIGIN
    d.text((30, 300), "the same axis — does l clear the frontier's net pull?", font=regular, fill=TEXT_FAINT)

    d.line([(ox, oy), (RAXIS_END_X, oy)], fill=(210, 205, 195), width=2)
    d.ellipse([ox - 3, oy - 3, ox + 3, oy + 3], fill=TEXT_FAINT)

    tick_x = ox + THRESHOLD * RSCALE
    d.line([(tick_x, oy - 24), (tick_x, oy + 24)], fill=DIAG_NEG, width=2)
    label = f"D+A = {THRESHOLD:.1f}"
    tw = d.textlength(label, font=smallbold)
    d.text((tick_x - tw / 2, oy - 44), label, font=smallbold, fill=DIAG_NEG)

    lx = ox + l_val * RSCALE
    draw_arrow(d, ox, oy, lx, oy, DIAG_YOU, width=6, head=9)
    d.text((lx + 10, oy - 8), f"l = {l_val:.1f}", font=smallbold, fill=DIAG_YOU)

    if win:
        d.text((RAXIS_END_X - 40, oy - 68), "w", font=bigw, fill=DIAG_YOU)
        cap = f"l ({l_val:.1f}) clears D+A ({THRESHOLD:.1f}) — winning."
    else:
        tag = "possibility of being fucked"
        tw = d.textlength(tag, font=smallbold)
        d.text((RAXIS_END_X - tw, oy - 40), tag, font=smallbold, fill=DIAG_NEG)
        cap = f"l ({l_val:.1f}) is short of D+A ({THRESHOLD:.1f})."

    d.text((30, 490), cap, font=regular, fill=TEXT)

    d.text((30, 525), "D = |Σ q_i c_i| = %.1f    A = q_k c_k = %.1f" % (D, A), font=small, fill=TEXT_FAINT)


def draw_frame(l_val):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    win = l_val > THRESHOLD
    draw_vector_band(d, l_val)
    draw_race_band(d, l_val, win)
    return img


if __name__ == "__main__":
    frames = []
    durations = []

    sweep_vals = [round(v, 1) for v in [i * 1.5 for i in range(0, 24)]]  # 0..34.5
    for v in sweep_vals:
        frames.append(draw_frame(v))
        durations.append(70)

    final_val = sweep_vals[-1]
    for _ in range(16):
        frames.append(draw_frame(final_val))
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
    print("saved", out_path, "threshold", THRESHOLD, "D", D, "A", A)
