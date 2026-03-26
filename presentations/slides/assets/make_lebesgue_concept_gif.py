import os
import numpy as np
import matplotlib.pyplot as plt
import imageio.v2 as imageio

OUT_DIR = r"d:\website\presentations\slides\assets"
os.makedirs(OUT_DIR, exist_ok=True)
out_gif = os.path.join(OUT_DIR, "lebesgue_concept.gif")

def g(x):
    # Nonnegative function on [0,1] for level-set visualization
    return 0.15 + 0.85 * (0.55 * np.exp(-((x - 0.25) / 0.16) ** 2) + 0.9 * np.exp(-((x - 0.72) / 0.2) ** 2))

x = np.linspace(0, 1, 900)
y = g(x)
ymax = float(y.max())

n_frames = 24
levels = np.linspace(0.03, ymax, n_frames)
frames = []

for i, level in enumerate(levels, start=1):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5), dpi=160)

    # Left: horizontal slicing in y
    ax1.plot(x, y, color="#0f766e", lw=2.5)
    ax1.fill_between(x, 0, np.minimum(y, level), color="#99f6e4", alpha=0.75)
    ax1.axhline(level, color="#c2410c", ls="--", lw=1.4)
    ax1.set_title("Horizontal level slicing (Lebesgue viewpoint)")
    ax1.set_xlabel("x")
    ax1.set_ylabel("g(x)")
    ax1.set_xlim(0, 1)
    ax1.set_ylim(0, ymax * 1.06)
    ax1.grid(alpha=0.2)

    mask = y >= level
    measure = np.trapezoid(mask.astype(float), x)

    # Right: contribution at current level
    ax2.barh([0], [measure], height=0.45, color="#14b8a6", alpha=0.9)
    ax2.set_xlim(0, 1)
    ax2.set_yticks([])
    ax2.set_xlabel("approx. measure of {x: g(x) >= t}")
    ax2.set_title("Level-set size at current t")
    ax2.grid(axis="x", alpha=0.2)

    fig.suptitle(
        rf"Frame {i}/{n_frames}: t={level:.3f}, |{{x: g(x) >= t}}| ~ {measure:.3f}",
        y=0.98,
        fontsize=11,
    )

    frame_path = os.path.join(OUT_DIR, f"_tmp_frame_{i:03d}.png")
    fig.tight_layout(rect=[0, 0, 1, 0.95])
    fig.savefig(frame_path)
    plt.close(fig)
    frames.append(imageio.imread(frame_path))

for i in range(1, n_frames + 1):
    os.remove(os.path.join(OUT_DIR, f"_tmp_frame_{i:03d}.png"))

imageio.mimsave(out_gif, frames, duration=0.22, loop=0)
print(out_gif)
