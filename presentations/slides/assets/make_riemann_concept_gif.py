import os
import numpy as np
import matplotlib.pyplot as plt
import imageio.v2 as imageio

OUT_DIR = r"d:\website\presentations\slides\assets"
os.makedirs(OUT_DIR, exist_ok=True)
out_gif = os.path.join(OUT_DIR, "riemann_concept.gif")

def g(x):
    return 0.15 + 0.85 * (0.55 * np.exp(-((x - 0.25) / 0.16) ** 2) + 0.9 * np.exp(-((x - 0.72) / 0.2) ** 2))

x_dense = np.linspace(0, 1, 1200)
y_dense = g(x_dense)
true_area = np.trapezoid(y_dense, x_dense)

n_frames = 20
ns = np.linspace(4, 60, n_frames).astype(int)
frames = []

for k, n in enumerate(ns, start=1):
    x = np.linspace(0, 1, n + 1)
    mid = 0.5 * (x[:-1] + x[1:])
    dx = x[1] - x[0]
    heights = g(mid)
    approx = np.sum(heights * dx)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5), dpi=160)

    # Left: rectangles approximating area
    ax1.plot(x_dense, y_dense, color="#0f766e", lw=2.3)
    ax1.bar(mid, heights, width=dx, align="center", alpha=0.32, color="#14b8a6", edgecolor="#0f766e", linewidth=0.5)
    ax1.set_title("Riemann viewpoint: partition the x-axis")
    ax1.set_xlabel("x")
    ax1.set_ylabel("g(x)")
    ax1.set_xlim(0, 1)
    ax1.set_ylim(0, y_dense.max() * 1.08)
    ax1.grid(alpha=0.2)

    # Right: approximation error bar view
    err = abs(approx - true_area)
    ax2.bar(["Riemann sum", "True area"], [approx, true_area], color=["#14b8a6", "#0f766e"], alpha=0.9)
    ax2.set_ylim(0, max(true_area, approx) * 1.2)
    ax2.set_title("Area estimate improves as partitions refine")
    ax2.text(0.5, 0.95 * ax2.get_ylim()[1], f"|error| ≈ {err:.5f}", ha="center", va="top", fontsize=11)
    ax2.grid(axis="y", alpha=0.2)

    fig.suptitle(f"Frame {k}/{n_frames}: n={n} subintervals, midpoint Riemann sum", y=0.98)

    frame_path = os.path.join(OUT_DIR, f"_riemann_frame_{k:03d}.png")
    fig.tight_layout(rect=[0, 0, 1, 0.95])
    fig.savefig(frame_path)
    plt.close(fig)
    frames.append(imageio.imread(frame_path))

for k in range(1, n_frames + 1):
    os.remove(os.path.join(OUT_DIR, f"_riemann_frame_{k:03d}.png"))

imageio.mimsave(out_gif, frames, duration=0.22, loop=0)
print(out_gif)
