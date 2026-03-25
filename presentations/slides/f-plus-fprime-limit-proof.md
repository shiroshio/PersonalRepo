# 극한 조건 $f+f^{\prime}$로부터 $f, f^{\prime}$의 극한 판정

문제:

$f:(0,\infty)\to\mathbb{R}$ 가 미분가능이고

$$
\lim_{x\to\infty}\bigl(f(x)+f'(x)\bigr)=L\in\mathbb{R}
$$

일 때

$$
\lim_{x\to\infty}f(x)=L,
\qquad
\lim_{x\to\infty}f'(x)=0
$$

가 성립하는지 보자.

---

## 결론(최종 1개)

성립한다. 즉

$$
\boxed{\lim_{x\to\infty}f(x)=L\quad\text{and}\quad\lim_{x\to\infty}f'(x)=0}
$$

아래에서 이 결론 하나를 단계적으로 보인다.

---

## 1단계: 식 정리

$h(x):=f(x)-L$ 로 두면

$$
h'(x)+h(x)=r(x),
\qquad
r(x):=f(x)+f'(x)-L.
$$

가정에서 $r(x)\to0$.

우리는

$$
h(x)\to0,
\qquad
h'(x)\to0
$$

를 보이면 된다.

---

## 2단계: 적분 가능한 형태로 바꾸기

곱의 미분법으로

$$
\bigl(e^x h(x)\bigr)'=e^x\bigl(h'(x)+h(x)\bigr)=e^x r(x).
$$

임의의 $A>0$ 와 $x\ge A$ 에 대해 적분하면

$$
e^x h(x)-e^A h(A)=\int_A^x e^t r(t)\,dt.
$$

따라서

$$
h(x)=e^{-(x-A)}h(A)+e^{-x}\int_A^x e^t r(t)\,dt.
$$

---

## 3단계: $h(x)\to0$ ($\varepsilon$-논법)

$\varepsilon>0$ 을 임의로 잡자.

$r(x)\to0$ 이므로 어떤 $A_\varepsilon>0$ 가 존재해

$$
|r(t)|<\varepsilon\quad(t\ge A_\varepsilon)
$$

가 된다.

위 식에서 $A=A_\varepsilon$ 로 두고, $x\ge A_\varepsilon$ 에 대해 절댓값을 취하면

$$
|h(x)|
\le e^{-(x-A_\varepsilon)}|h(A_\varepsilon)| + e^{-x}\int_{A_\varepsilon}^x e^t|r(t)|dt
$$

$$
|h(x)|
\le e^{-(x-A_\varepsilon)}|h(A_\varepsilon)| + \varepsilon e^{-x}\int_{A_\varepsilon}^x e^tdt
$$

$$
e^{-x}\int_{A_\varepsilon}^x e^tdt = 1-e^{-(x-A_\varepsilon)}
$$

$$
|h(x)|
\le e^{-(x-A_\varepsilon)}|h(A_\varepsilon)| + \varepsilon\bigl(1-e^{-(x-A_\varepsilon)}\bigr)
\le e^{-(x-A_\varepsilon)}|h(A_\varepsilon)|+\varepsilon.
$$

이제 $x$ 를 충분히 크게 잡아

$$
e^{-(x-A_\varepsilon)}|h(A_\varepsilon)|<\varepsilon
$$

가 되게 하면

$$
|h(x)|<2\varepsilon.
$$

$\varepsilon$ 임의이므로 $h(x)\to0$.

---

## 4단계: $h'(x)\to0$

기본식 $h'+h=r$ 에서

$$
h'(x)=r(x)-h(x).
$$

이미 $r(x)\to0$, $h(x)\to0$ 이므로

$$
|h'(x)|\le |r(x)|+|h(x)|\to0.
$$

즉 $h'(x)\to0$.

---

## 5단계: 원래 함수로 복귀

$h=f-L$ 이므로

$$
f(x)=h(x)+L\to L,
\qquad
f'(x)=h'(x)\to0.
$$

따라서 최종 결론:

$$
\boxed{\lim_{x\to\infty}f(x)=L,\quad \lim_{x\to\infty}f'(x)=0.}
$$

---

## 발표용 짧은 요약

- $h=f-L$ 로 바꿔 $h'+h=r$, $r\to0$ 를 얻는다.
- $(e^x h)'=e^x r$ 를 적분해 $h(x)$ 표현식을 만든다.
- $|r(t)|<\varepsilon$ 를 이용해 $|h(x)|$ 를 직접 끼워맞추면 $h\to0$.
- 마지막에 $h'=r-h$ 로부터 $h'\to0$, 즉 $f\to L$, $f'\to0$.
