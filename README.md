# Sorte.ar

Aplicativo web para sorteio de times, criação de grupos e gerenciamento de campeonatos de EAFC (EA Sports FC).

## Funcionalidades

- **Sorteio de times** a partir de ligas pré-configuradas (Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Liga Portugal, Mundial 2026, Seleções Clássicas), lista livre ou atribuição manual
- **Potes** para distribuição equilibrada de jogadores nos grupos
- **4 formatos de campeonato**: Grupos + Mata-mata, Só Grupos, Só Mata-mata e Liga
- **Fase de grupos** com tabela de classificação, rodadas colapsáveis e desempate por confronto direto
- **Mata-mata** com bracket visual e suporte a pênaltis em empates
- **Liga** com calendário round-robin (ida e/ou volta)
- **Artilharia** rastreada em todas as fases
- **Persistência automática** via `localStorage` — fechar e reabrir a aba restaura o campeonato em andamento

## Stack

Aplicação front-end pura — HTML + CSS + JavaScript vanilla. Sem dependências externas além das fontes do Google Fonts. Não requer servidor nem processo de build.

## Como usar localmente

```bash
git clone https://github.com/seu-usuario/Sorte.ar.git
cd Sorte.ar
# Abra o index.html diretamente no navegador, ou use um servidor local:
npx serve .
```

> Não é necessário `npm install`. O projeto não possui dependências de build.

## Estrutura

```
Sorte.ar/
├── index.html       # Estrutura e páginas da aplicação
├── css/
│   └── style.css    # Estilos (design system de variáveis CSS)
└── js/
    └── script.js    # Toda a lógica da aplicação
```

## Contribuindo

Pull requests são bem-vindos. Para mudanças grandes, abra uma issue primeiro para discutir o que você gostaria de alterar.

## Licença

Veja [LICENSE](LICENSE).
