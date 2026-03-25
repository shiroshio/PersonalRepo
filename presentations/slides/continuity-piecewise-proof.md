# 유리/무리 분할 함수의 연속성

정리:

$f,g \in C(\mathbb{R})$ 이고

$$
r(x)=
\begin{cases}
f(x), & x\in\mathbb{Q}, \\\\
g(x), & x\in\mathbb{Q}^c.
\end{cases}
$$

일 때, 임의의 $a\in\mathbb{R}$ 에 대해

$$
r \text{ 가 } a\text{ 에서 연속 } \iff f(a)=g(a).
$$

---

## (필요조건) 연속이면 두 함수값이 같다

- $\mathbb{Q}$ 와 $\mathbb{Q}^c$ 는 모두 $\mathbb{R}$ 에서 조밀하다.
- 따라서 $a_n\in\mathbb{Q}$, $b_n\in\mathbb{Q}^c$ 이고
  $a_n\to a$, $b_n\to a$ 인 수열을 잡을 수 있다.

연속성으로부터

$$
r(a_n)\to r(a),\qquad r(b_n)\to r(a).
$$

하지만 정의상

$$
r(a_n)=f(a_n),\qquad r(b_n)=g(b_n).
$$

그리고 $f,g$ 의 연속성 때문에

$$
f(a_n)\to f(a),\qquad g(b_n)\to g(a).
$$

따라서

$$
f(a)=r(a)=g(a)
$$

이므로 $f(a)=g(a)$.

---

## (충분조건) 두 함수값이 같으면 연속이다

목표: $x\to a$ 일 때 $r(x)\to r(a)$.

먼저 $f(a)=g(a)=:L$ 라고 두자.
연속성으로부터 임의의 $\varepsilon>0$ 에 대해 적당한 $\delta_f,\delta_g>0$ 가 존재하여

$$
|x-a|<\delta_f\Rightarrow |f(x)-L|<\varepsilon,
$$
$$
|x-a|<\delta_g\Rightarrow |g(x)-L|<\varepsilon.
$$

$\delta=\min(\delta_f,\delta_g)$ 로 두면,
$|x-a|<\delta$ 인 모든 $x$ 에 대해

- $x\in\mathbb{Q}$ 이면 $r(x)=f(x)$ 이므로 $|r(x)-L|<\varepsilon$.
- $x\in\mathbb{Q}^c$ 이면 $r(x)=g(x)$ 이므로 $|r(x)-L|<\varepsilon$.

즉 모든 경우에 $|r(x)-L|<\varepsilon$.
따라서 r는 a에서 연속이다.

---

## 결론

$$
r \text{ 가 } a\text{ 에서 연속 } \iff f(a)=g(a).
$$

핵심 아이디어:

- 필요조건: 유리수/무리수 조밀성과 수열 극한
- 충분조건: $f,g$ 의 연속성과 값 일치점 $f(a)=g(a)$
