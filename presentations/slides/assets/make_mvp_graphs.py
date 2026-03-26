import numpy as np
import matplotlib.pyplot as plt


def f(x):
    # Smooth increasing map: f(0)=0, f(1)=1, f'(x)>0
    return x**2


def fp(x):
    return 2 * x


def inverse_f(y):
    return np.sqrt(y)


ASSET_DIR = r"d:\website\presentations\slides\assets"

# Choose positive weights summing to 1
weights = np.array([0.10, 0.15, 0.20, 0.25, 0.30])
y = np.concatenate(([0.0], np.cumsum(weights)))
x = inverse_f(y)
c = 0.5 * (x[:-1] + x[1:])

dx = x[1:] - x[:-1]
term = weights / fp(c)

# Figure 1: horizontal y-slices and preimage x-lengths on the graph
fig1, ax1 = plt.subplots(figsize=(10, 6), dpi=180)
xx = np.linspace(0, 1, 400)
ax1.plot(xx, f(xx), color="#0f766e", lw=2.5, label=r"$y=f(x)=x^2$")

for i in range(1, len(y) - 1):
    ax1.hlines(y[i], 0, 1, colors="#9ca3af", linestyles="--", linewidth=1)

for i in range(len(weights)):
    ax1.vlines([x[i], x[i + 1]], 0, y[i + 1], colors="#c2410c", linewidth=1.3, alpha=0.85)
    ym = 0.5 * (y[i] + y[i + 1])
    xm = 0.5 * (x[i] + x[i + 1])
    ax1.text(xm + 0.01, ym, rf"$w_{i+1}$", fontsize=10, color="#1f2937")
    ax1.annotate(
        "",
        xy=(x[i], -0.03),
        xytext=(x[i + 1], -0.03),
        arrowprops=dict(arrowstyle="<->", color="#1f2937", lw=1.2),
        annotation_clip=False,
    )
    ax1.text(xm, -0.06, rf"$\Delta x_{i+1}$", ha="center", va="top", fontsize=9)

ax1.set_xlim(0, 1)
ax1.set_ylim(-0.1, 1.02)
ax1.set_xlabel("x")
ax1.set_ylabel("y")
ax1.set_title("Horizontal y-slices and pulled-back x-lengths")
ax1.legend(loc="upper left")
ax1.grid(alpha=0.15)
fig1.tight_layout()
fig1.savefig(f"{ASSET_DIR}\\mvp_y_slices_preimage.png")
plt.close(fig1)

# Figure 2: bars showing sum w_i/f'(c_i) equals total x-length
fig2, (ax2, ax3) = plt.subplots(1, 2, figsize=(12, 4.8), dpi=180)

labels = [rf"$i={i+1}$" for i in range(len(weights))]
ax2.bar(labels, term, color="#0f766e", alpha=0.88)
ax2.set_title(r"Terms $\frac{w_i}{f'(c_i)}$")
ax2.set_ylabel("length contribution")
ax2.grid(axis="y", alpha=0.2)

cum = np.cumsum(term)
left = 0.0
for i, t in enumerate(term):
    ax3.barh([0], [t], left=left, height=0.45, alpha=0.9)
    ax3.text(left + t / 2, 0, rf"$\frac{{w_{i+1}}}{{f'(c_{i+1})}}$", ha="center", va="center", fontsize=9)
    left += t

ax3.set_xlim(0, max(1.0, left * 1.05))
ax3.set_yticks([])
ax3.set_title(r"Stacked length: $\sum_i \frac{w_i}{f'(c_i)}$")
ax3.axvline(1.0, color="#c2410c", linestyle="--", linewidth=1.5, label="target = 1")
ax3.legend(loc="lower right")
ax3.grid(axis="x", alpha=0.2)

fig2.suptitle(r"Visual check of $\sum_i \frac{w_i}{f'(c_i)} = x_n-x_0 = 1$", y=1.02)
fig2.tight_layout()
fig2.savefig(f"{ASSET_DIR}\\mvp_weighted_length_sum.png")
plt.close(fig2)

print("Saved:")
print(f"{ASSET_DIR}\\mvp_y_slices_preimage.png")
print(f"{ASSET_DIR}\\mvp_weighted_length_sum.png")
