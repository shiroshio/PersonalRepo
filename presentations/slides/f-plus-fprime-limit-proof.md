# 극한 조건 $f+f^{\prime}$로부터 $f, f^{\prime}$의 극한 판정

문제:

$f:(0,\infty)\to\mathbb{R}$ 가 미분가능이고

$$
\lim_{x\to\infty}\bigl(f(x)+f'(x)\bigr)=L\in\mathbb{R}
$$

일 때, 다음이 참인가?

$$
\lim_{x\to\infty}f(x)=L,
\qquad
\lim_{x\to\infty}f'(x)=0.
$$

---

## 결론

명제는 **참(True)** 이다.

즉,

$$
\lim_{x\to\infty}(f+f')=L
\quad\Longrightarrow\quad
\lim_{x\to\infty}f=L,
\quad
\lim_{x\to\infty}f'=0.
$$

---

## 1단계: 중심화(shift)

$h(x):=f(x)-L$ 로 두면, $h$ 는 미분가능이고

$$
h(x)+h'(x)=f(x)+f'(x)-L=:r(x).
$$

여기서

$$
\lim_{x\to\infty}r(x)=0.
$$

따라서 문제는 다음으로 바뀐다:

$$
\lim_{x\to\infty}(h+h')=0
\quad\Rightarrow\quad
\lim_{x\to\infty}h=0,
\quad
\lim_{x\to\infty}h'=0.
$$

---

## 2단계: 적분인자 표현

방정식

$$
h'(x)+h(x)=r(x).
$$

에 적분인자 $e^x$ 를 곱하면

$$
\bigl(e^x h(x)\bigr)'=e^x r(x).
$$

임의의 $a>0$ 에 대해 적분하면

$$
e^x h(x)-e^a h(a)=\int_a^x e^t r(t)\,dt.
$$

즉

$$
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

## 결론

명제는 참이다.

이번 증명은 코시 평균값 정리가 아니라,
**일반 평균값 정리(Lagrange MVT)** 만으로 진행한다.

---

## 1단계: 중심화

$h(x):=f(x)-L$ 로 두면

$$
h'(x)+h(x)=r(x),
\qquad
r(x):=f(x)+f'(x)-L,
\qquad
r(x)\to 0.
$$

목표는

$$
h(x)\to 0,
\qquad
h'(x)\to 0.
$$

---

## 2단계: 보조함수와 MVT

보조함수

$$
g(x):=e^x h(x)
$$

를 두면 미분가능이고

$$
g'(x)=e^x\bigl(h'(x)+h(x)\bigr)=e^x r(x).
$$

임의의 $x>0$ 에 대해 구간 $[x,x+1]$ 에 일반 평균값 정리를 적용하면,
어떤 $\xi_x\in(x,x+1)$ 가 존재하여

$$
g(x+1)-g(x)=g'(\xi_x)=e^{\xi_x}r(\xi_x).
$$

즉

$$
h(x+1)=e^{-1}h(x)+e^{\xi_x-(x+1)}r(\xi_x).
$$

여기서 $0<e^{\xi_x-(x+1)}<1$.

---

## 3단계: 정수점에서 $h(n)\to 0$

$q:=e^{-1}\in(0,1)$,

$$
a_n:=|h(n)|,
\qquad
m_n:=\sup_{t\ge n}|r(t)|
$$

로 두면 $r(t)\to0$ 이므로 $m_n\to0$.

위 식에서

$$
a_{n+1}\le q a_n + m_n.
$$

$\varepsilon>0$ 을 택하고, 충분히 큰 $N$ 에 대해

$$
m_n\le (1-q)\varepsilon\quad(n\ge N)
$$

가 되게 하자. 반복하면 ($n>N$)

$$
a_n
\le q^{n-N}a_N + \sum_{k=N}^{n-1} q^{n-1-k}m_k
\le q^{n-N}a_N + (1-q)\varepsilon\sum_{j=0}^{n-N-1}q^j
\le q^{n-N}a_N+\varepsilon.
$$

$n\to\infty$ 후 $\limsup a_n\le\varepsilon$.
$\varepsilon$ 임의이므로

$$
h(n)\to0\quad(n\to\infty).
$$

---

## 4단계: 모든 실수 $x\to\infty$ 에서 $h(x)\to0$

$x\ge1$ 에 대해 $n:=\lfloor x\rfloor$ 로 두면 $x\in[n,n+1]$.

구간 $[n,x]$ 에 MVT를 $g$ 에 적용하면 어떤 $\eta_x\in(n,x)$ 가 존재하여

$$
g(x)-g(n)=g'(\eta_x)=e^{\eta_x}r(\eta_x).
$$

따라서

$$
h(x)=e^{-(x-n)}h(n)+e^{\eta_x-x}r(\eta_x).
$$

여기서 $0<e^{-(x-n)}\le1$, $0<e^{\eta_x-x}\le1$ 이므로

$$
|h(x)|\le |h(n)|+\sup_{t\ge n}|r(t)|=|h(n)|+m_n.
$$

$x\to\infty$ 이면 $n\to\infty$, 이미 $h(n)\to0$, $m_n\to0$ 이므로

$$
h(x)\to0.
$$

---

## 5단계: $h'(x)\to0$ 그리고 결론

식 $h'+h=r$ 에서

$$
h'(x)=r(x)-h(x).
$$

$r(x)\to0$, $h(x)\to0$ 이므로

$$
h'(x)\to0.
$$

원래 변수로 돌아가면

$$
f(x)=h(x)+L\to L,
\qquad
f'(x)=h'(x)\to0.
$$

즉

$$
\boxed{\lim_{x\to\infty}f(x)=L,\;\lim_{x\to\infty}f'(x)=0.}
$$

---

## 발표용 요약

- $h=f-L$ 로 치환해 $h'+h=r$, $r\to0$ 를 만든다.
- $g=e^xh$ 를 두고 길이 1 구간에 일반 평균값 정리를 적용한다.
- 점화형 부등식 $a_{n+1}\le e^{-1}a_n+m_n$ 과 $m_n\to0$ 로 $h(n)\to0$.
- 다시 MVT로 정수점 결과를 실수 전체로 확장해 $h\to0$, 이어서 $h'=r-h\to0$.
