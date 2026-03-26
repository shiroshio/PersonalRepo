# A Weighted Mean-Value Problem

## 202611116 박우민

---

## Statement

Let $f:[0,1]\to\mathbb{R}$ satisfy:

1. $f$ is continuous on $[0,1]$.
2. $f$ is differentiable on $(0,1)$.
3. $f'(x)>0$ for every $x\in(0,1)$.
4. $f(0)=0$ and $f(1)=1$.

Let $w_1,\dots,w_n>0$ with

$$
\sum_{i=1}^n w_i=1.
$$

Show that there exist $c_1,\dots,c_n\in(0,1)$ such that

$$
\sum_{i=1}^n \frac{w_i}{f'(c_i)}=1.
$$

---

## Idea of the Proof

We convert weights into partition points of $[0,1]$,
then apply the usual Mean Value Theorem on each piece.

---

## Step 1: Build Cumulative Sums

Define

$$
y_0=0,
\qquad
y_i=\sum_{k=1}^i w_k\quad(i=1,\dots,n).
$$

Since each $w_i>0$,

$$
0=y_0<y_1<\cdots<y_n=1.
$$

---

## Step 2: Pull Back by $f$

Because $f$ is continuous on $[0,1]$ and $f(0)=0, f(1)=1$,
IVT gives, for each $i$, a point $x_i\in[0,1]$ with

$$
f(x_i)=y_i.
$$

Also, $f'(x)>0$ implies $f$ is strictly increasing,
so each $x_i$ is unique.

Hence

$$
0=x_0<x_1<\cdots<x_n=1.
$$

---

## Step 3: Apply MVT on Each Interval

Fix $i\in\{1,\dots,n\}$. On $[x_{i-1},x_i]$,
$f$ is continuous and differentiable inside,
so by MVT there exists

$$
c_i\in(x_{i-1},x_i)\subset(0,1)
$$

such that

$$
f'(c_i)=\frac{f(x_i)-f(x_{i-1})}{x_i-x_{i-1}}
=\frac{y_i-y_{i-1}}{x_i-x_{i-1}}
=\frac{w_i}{x_i-x_{i-1}}.
$$

So

$$
x_i-x_{i-1}=\frac{w_i}{f'(c_i)}.
$$

---

## Step 4: Sum Everything

Now sum over $i=1,\dots,n$:

$$
\sum_{i=1}^n \frac{w_i}{f'(c_i)}
=\sum_{i=1}^n (x_i-x_{i-1})
=x_n-x_0
=1.
$$

Therefore,

$$
\boxed{\sum_{i=1}^n \frac{w_i}{f'(c_i)}=1.}
$$

---

## Extra Perspective: Why This Feels Different

In many calculus proofs, we split the **x-axis** first.

Here we did the opposite:

- first split the **y-axis** by cumulative weights $y_i$
- then pull those level intervals back to x-space
- then add the pulled-back lengths

So this proof is not just a technical MVT trick.
It has a clear geometric viewpoint.

---

## Geometric Interpretation

From Step 3 we got

$$
x_i-x_{i-1}=\frac{w_i}{f'(c_i)}.
$$

Interpretation:

- $w_i=y_i-y_{i-1}$ is a small vertical increment
- dividing by $f'(c_i)$ converts vertical scale to horizontal scale
- $\frac{w_i}{f'(c_i)}$ is the corresponding horizontal length

So

$$
\sum_{i=1}^n \frac{w_i}{f'(c_i)}
$$

is literally the total horizontal length from $0$ to $1$.

---

## Bridge to a Lebesgue-Type View (Informal)

This is close in spirit to a level-set viewpoint:

- organize by function values (levels in y)
- measure the size of preimages in x

If we formally write $y=f(x)$, then

$$
dy=f'(x)\,dx,
\qquad
dx=\frac{1}{f'(x)}\,dy.
$$

So "adding x-lengths by y-levels" suggests

$$
\int_0^1 \frac{1}{f'(f^{-1}(y))}\,dy=1.
$$

Our finite weighted identity is a discrete prototype of that picture.

---

## Important Clarification

For this proof, the weights do **not** need to be all different.

What is really needed is only:

- $w_i>0$ for each $i$
- $\sum_{i=1}^n w_i=1$

Distinctness is optional, not essential.

---

## Closing Script (for presentation)

"The main proof is elementary: IVT + MVT + telescoping.
But the way we set it up is the interesting part.
We partition in y first, and measure pulled-back x-lengths.
That perspective is exactly why this result naturally connects
to a Lebesgue-style way of thinking about integration."
