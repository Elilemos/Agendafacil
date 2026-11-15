# React + Vite

Este projeto usa React com Vite, atualização automática durante o desenvolvimento (HMR) e algumas regras do ESLint.

Há dois plugins oficiais disponíveis:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) usa [Oxc](https://oxc.rs).
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) usa [SWC](https://swc.rs/).

## Compilador do React

O React Compiler não está habilitado neste projeto porque pode afetar o desempenho durante o desenvolvimento e a compilação. Para adicioná-lo, consulte [a documentação](https://react.dev/learn/react-compiler/installation).

## Ampliar a configuração do ESLint

Para desenvolver uma aplicação de produção, recomendamos usar TypeScript com regras de análise que considerem os tipos. Consulte o [modelo com TypeScript](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) para saber como integrar TypeScript e [`typescript-eslint`](https://typescript-eslint.io) ao projeto.
