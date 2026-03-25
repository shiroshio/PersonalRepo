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
h(x)=e^{-x}\Bigl(e^a h(a)+\int_a^x e^t r(t)\,dt\Bigr).
$$

---

## 3단계: $h(x)\to 0$ 증명

위 식을

$$
h(x)=e^{-x}e^a h(a)+\frac{\int_a^x e^t r(t)\,dt}{e^x}.
$$

로 본다.

- 첫 항은 자명하게 $x\to\infty$ 에서 $0$.
- 둘째 항의 극한을 본다.

$R(x):=\int_a^x e^t r(t)\,dt$ 라 두면 $R$ 는 미분가능, $R'(x)=e^x r(x)$.

이제 두 경우:

1. $R(x)$ 가 유계이면 $R(x)/e^x\to 0$.
2. $R(x)$ 가 $\pm\infty$ 로 발산하면 로피탈 정리로 다음을 얻는다.

$$
\lim_{x\to\infty}\frac{R(x)}{e^x}
=
\lim_{x\to\infty}\frac{R'(x)}{e^x}
=
\lim_{x\to\infty}r(x)=0.
$$

두 경우 모두 둘째 항의 극한은 $0$ 이므로

$$
\lim_{x\to\infty}h(x)=0.
$$

---

## 4단계: $h'(x)\to 0$ 증명

정의식 $h'+h=r$ 에서

$$
h'(x)=r(x)-h(x).
$$

이미

$$
r(x)\to 0,
\qquad
h(x)\to 0.
$$

이므로

$$
\lim_{x\to\infty}h'(x)=0.
$$

---

## 5단계: 원래 함수로 복귀

$h=f-L$ 였으므로

$$
\lim_{x\to\infty}f(x)=L,
\qquad
\lim_{x\to\infty}f'(x)=\lim_{x\to\infty}h'(x)=0.
$$

따라서 원문 명제는 참.

$$
\boxed{\text{True}}
$$

---

## 발표용 한 줄 요약

- 핵심 변환: $h=f-L$ 로 바꿔 $h'+h=r$, $r\to0$ 획득
- 핵심 도구: 적분인자 $e^x$ 와 $\dfrac{\int_a^x e^t r(t)dt}{e^x}$ 의 극한 판정
- 결론: $h\to0$, $h'\to0$ hence $f\to L$, $f'\to0$
