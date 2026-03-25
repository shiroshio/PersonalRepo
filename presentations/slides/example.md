# Markdown + LaTeX 발표 템플릿

리포트 에디터에서 작성한 .md 파일을 그대로 발표 슬라이드로 변환합니다.

- 구분선 `---` 로 다음 가로 슬라이드
- 구분선 `--` 로 다음 세로 슬라이드

인라인 수식 예시: $E=mc^2$

---

## 수식 예시

$$
\int_a^b f(x)\,dx
$$

$$
\frac{\partial z}{\partial x} = \frac{\partial}{\partial x}f(x,y)
$$

---

## 코드 블록 예시

```javascript
function hello(name) {
  return `Hello, ${name}`;
}
```

발표용 문서로 교체하려면 이 파일을 본인 .md로 바꾸거나,
`data-markdown` 속성의 파일명을 변경하세요.
