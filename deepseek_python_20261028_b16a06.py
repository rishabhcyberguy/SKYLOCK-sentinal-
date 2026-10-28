"""
Digital Green Rotating Earth — Wireframe / Tactical Globe
Requires: matplotlib, numpy
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

plt.style.use('dark_background')          # ← forces dark figure bg on Windows

# ---------- Style ----------
GREEN      = '#00FF41'
DEEP_GREEN = '#003B10'
BG         = '#000000'

# ---------- Figure ----------
fig = plt.figure(figsize=(9, 9), facecolor=BG)
ax  = fig.add_subplot(111, projection='3d', facecolor=BG)
ax.set_box_aspect([1, 1, 1])
ax.set_axis_off()
ax.set_xlim(-1.15, 1.15)
ax.set_ylim(-1.15, 1.15)
ax.set_zlim(-1.15, 1.15)
ax.view_init(elev=20, azim=0)

# ---------- Translucent core sphere ----------
u = np.linspace(0, 2 * np.pi, 60)
v = np.linspace(0, np.pi, 60)
sx = np.outer(np.cos(u), np.sin(v))
sy = np.outer(np.sin(u), np.sin(v))
sz = np.outer(np.ones_like(u), np.cos(v))
ax.plot_surface(sx, sy, sz, color=DEEP_GREEN, alpha=0.25,
                shade=False, linewidth=0, antialiased=True)

# ---------- Latitude rings ----------
for lat_deg in range(-80, 81, 10):
    lat = np.deg2rad(lat_deg)
    lon = np.linspace(0, 2 * np.pi, 250)
    x = np.cos(lat) * np.cos(lon)
    y = np.cos(lat) * np.sin(lon)
    z = np.full_like(lon, np.sin(lat))
    is_equator = lat_deg == 0
    ax.plot(x, y, z,
            color=GREEN,
            lw=1.4 if is_equator else 0.45,
            alpha=1.0 if is_equator else 0.40)

# ---------- Longitude rings ----------
for lon_deg in range(0, 360, 15):
    lon = np.deg2rad(lon_deg)
    lat = np.linspace(-np.pi / 2, np.pi / 2, 250)
    x = np.cos(lat) * np.cos(lon)
    y = np.cos(lat) * np.sin(lon)
    z = np.sin(lat)
    is_prime = lon_deg == 0
    ax.plot(x, y, z,
            color=GREEN,
            lw=1.4 if is_prime else 0.45,
            alpha=1.0 if is_prime else 0.35)

# ---------- Pole markers ----------
ax.scatter([0], [0], [ 1], color=GREEN, s=120, alpha=1.0, edgecolors=GREEN)
ax.scatter([0], [0], [-1], color=GREEN, s=120, alpha=1.0, edgecolors=GREEN)

# ---------- Animation ----------
def update(frame):
    ax.view_init(elev=20, azim=frame)
    return []

ani = FuncAnimation(fig, update, frames=np.arange(0, 360, 1),
                    interval=50, blit=False)
plt.tight_layout()
plt.show()