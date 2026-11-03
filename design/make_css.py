"""Builds design/aths.css for the canvas: the approved swimming styles.css, scoped to one
artboard so each board can be light or dark on its own, plus the athletics extras."""
import re
SW = "/Users/jordan.dennis/SWIM 2027- App/ccas-swimming/css/styles.css"
s = open(SW).read()
# tokens: light on .aths, dark on .aths.dark
s = s.replace(":root{\n  --bg", ".aths{\n  --bg", 1)
s = re.sub(r'@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{.*?color-scheme:dark\}\}\n', "", s, count=1, flags=re.S)
s = s.replace(':root[data-theme="dark"]{', ".aths.dark{", 1)
s = re.sub(r'^@media \(prefers-color-scheme:dark\)\{:root:not.*$\n', "", s, flags=re.M)
s = s.replace(':root[data-theme="dark"] ', ".aths.dark ")
s = s.replace("html,body{min-height:100%}\n", "")
s = re.sub(r"^body\{background.*$", ".aths{background:var(--bg);color:var(--ink);font-family:var(--font-body);font-size:16px;line-height:1.45}", s, count=1, flags=re.M)
s = re.sub(r"^body::before.*$\n", "", s, flags=re.M)
extra = open("aths-extra.css").read()
open("aths.css", "w").write(s + "\n" + extra)
