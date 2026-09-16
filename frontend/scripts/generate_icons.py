"""Regenerate launcher artwork with the Pillow version pinned by the backend."""

from pathlib import Path
import re

from PIL import Image, ImageDraw


FRONTEND = Path(__file__).resolve().parents[1]
ASSETS = FRONTEND / "assets"
css = (FRONTEND / "global.css").read_text()
primary = tuple(map(int, re.search(r"--primary:\s*(\d+ \d+ \d+);", css)[1].split()))
foreground = tuple(
    map(int, re.search(r"--primary-foreground:\s*(\d+ \d+ \d+);", css)[1].split())
)

# Draw at 4x, then downsample for smooth edges. The mark fits Android's central
# adaptive-icon safe zone and needs no platform-specific font.
scale = 4
mark = Image.new("RGBA", (1024 * scale, 1024 * scale))
draw = ImageDraw.Draw(mark)
draw.ellipse(
    tuple(n * scale for n in (270, 248, 730, 728)),
    outline=foreground,
    width=92 * scale,
)
draw.line(
    tuple(n * scale for n in (577, 597, 722, 752)),
    fill=foreground,
    width=92 * scale,
)
draw.ellipse(tuple(n * scale for n in (531, 551, 623, 643)), fill=foreground)
draw.ellipse(tuple(n * scale for n in (676, 706, 768, 798)), fill=foreground)
mark = mark.resize((1024, 1024), Image.Resampling.LANCZOS)
mark.save(ASSETS / "android-icon-foreground.png")
mark.save(ASSETS / "android-icon-monochrome.png")

icon = Image.new("RGB", mark.size, primary)
icon.paste(mark, mask=mark.getchannel("A"))
icon.save(ASSETS / "icon.png")
icon.resize((64, 64), Image.Resampling.LANCZOS).save(ASSETS / "favicon.png")
