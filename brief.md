#Folha Verde

#Objetivo
Um journal digital pessoal onde o usuário pode escrever livremente sobre o seu dia, organizar tarefas e consultar entradas anteriores pelo calendário.

#Funcionalidades
Escrita livre diária com auto-save (debounce de ~800ms)
To-do list por dia com itens editáveis inline e check/uncheck
Citação do dia (cacheada no localStorage, não repete no mesmo dia)
Calendário para navegar entre dias com entrada registrada
Nome do usuário salvo no primeiro acesso, nunca pergunta de novo


#Telas
Tela de boas-vindas (primeira visita)
Input para digitar o nome
Botão confirmar → salva no localStorage → redireciona para tela principal
Animação de entrada com Framer Motion

#Tela principal
┌─────────────────────────────────────────────────────┐
│  Olá, [Nome]                                        │
├───────────────────────────────────┬─────────────────┤
│                                   │ ┌─────────────┐ │
│  ________________________________ │ │  Citação    │ │
│  ________________________________ │ │  do dia     │ │
│  ________________________________ │ └─────────────┘ │
│  ________________________________ │                 │
│  ________________________________ │ ┌─────────────┐ │
│  ________________________________ │ │ Hoje é dia  │ │
│  ________________________________ │ │ 31 de março │ │
│  ________________________________ │ │─────────────│ │
│  ________________________________ │ │ O que você  │ │
│  ________________________________ │ │ tem pra     │ │
│  ________________________________ │ │ hoje?       │ │
│  ________________________________ │ │ [ ] tarefa  │ │
│  ________________________________ │ │ [✓] tarefa  │ │
│  ________________________________ │ │ + adicionar │ │
└───────────────────────────────────┴─────────────────┘
Calendário (overlay ao clicar na data)

Grid do mês atual
Dias com entrada marcados com ponto verde
Clicar num dia carrega a entrada daquele dia

Entrada de dia passado

Mesma tela principal, porém carregando os dados do dia selecionado
Journal e to-do editáveis normalmente


Estilo visual

Paleta: verde & bege, clima aconchegante
Fonte: Caveat (Google Fonts) — estilo manuscrito, igual Excalidraw
Animações: Framer Motion em transições de tela e abertura do calendário
Journal com fundo estilo papel pautado (linhas simuladas com CSS repeating-linear-gradient)
Layout: CSS Grid duas colunas 1fr 320px, apenas desktop por enquanto


#Tecnologias desejadas
CamadaTecnologiaUIReact + ViteEstiloCSS puroAnimaçõesFramer MotionDadoslocalStorageDatasDay.jsCitaçõesQuotable API

#Regras importantes

Uma entrada por dia (chave = "YYYY-MM-DD")
Auto-save no localStorage enquanto digita (sem botão de salvar)
Citação do dia buscada uma vez e cacheada com a data no localStorage
Nome perguntado apenas uma vez, nunca resetar isso
Nenhum backend, tudo client-side
Apenas desktop por enquanto, ignorar responsividade


Estrutura de dados (localStorage)
json{
  "userName": "Maria",
  "dailyQuote": {
    "date": "2026-03-31",
    "text": "A vida é...",
    "author": "Fulano"
  },
  "entries": {
    "2026-03-31": {
      "journal": "Hoje foi um dia...",
      "todos": [
        { "id": 1, "text": "Reunião com o time", "done": false },
        { "id": 2, "text": "Tomar água", "done": true }
      ]
    }
  }
}