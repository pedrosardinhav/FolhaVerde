# Folha Verde

Folha Verde é um journal digital pessoal feito para registrar pensamentos, organizar tarefas do dia e revisitar entradas anteriores de um jeito leve, aconchegante e simples.

O projeto foi desenvolvido como uma experiência totalmente client-side, com foco em escrita livre, uso diário e uma interface com clima de papel, tons naturais e tipografia manuscrita.

## Preview

- Onboarding com nome do usuário salvo localmente
- Journal diário com auto-save
- Lista de tarefas por dia
- Citação do dia com cache local
- Calendário para navegar entre entradas anteriores

## Tecnologias

- React
- Vite
- CSS puro
- Framer Motion
- Day.js
- localStorage

## Funcionalidades

- Escrita livre diária com salvamento automático
- Uma entrada por dia no formato `YYYY-MM-DD`
- To-do list diária com checkbox, edição inline e remoção
- Citação do dia salva em cache para não trocar a cada reload
- Navegação por calendário com marcação visual dos dias que possuem entrada
- Bloqueio de datas futuras para manter a proposta do journal mais realista

## Como rodar localmente

```bash
npm install
npm run dev
```

Depois, abra o endereço mostrado no terminal, normalmente:

```bash
http://localhost:5173
```

## Build de produção

```bash
npm run build
npm run preview
```

## Estrutura

```text
.
├── src
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
└── vite.config.js
```

## Armazenamento local

Os dados ficam salvos no navegador usando `localStorage`, incluindo:

- nome do usuário
- citação do dia
- entradas do journal
- tarefas de cada dia

Nenhum backend é utilizado.

## Ideia do produto

O Folha Verde foi pensado como um espaço pessoal para responder, no seu ritmo:

- pelo que você é grato
- o que pretende fazer hoje
- qual é a sua inspiração

## Status

Projeto em evolução. A base principal da experiência já está funcionando e novas melhorias de UX e produto podem ser adicionadas aos poucos.
