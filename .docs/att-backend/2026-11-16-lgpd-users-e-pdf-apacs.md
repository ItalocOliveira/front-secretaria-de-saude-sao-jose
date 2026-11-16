# 2026-11-16 — LGPD: `GET /users` sem CPF criptografado e PDF da APAC com 5 min

## 1. `GET /users` e `POST /users` não devolvem mais `cpf_encrypted`

O campo saiu da resposta (era o CPF criptografado, sem uso no front). Remova `cpf_encrypted` do tipo
em `src/api/users.ts`. Nenhum outro campo mudou.

## 2. `pdf_url` das APACs agora vale 5 minutos

Em `GET /apacs`, o `pdf_url` de cada APAC expira **5 minutos** depois da listagem (antes era 1 hora).
Ofícios (`GET /documents`) e imagens de itens continuam com 1 hora.

Impacto: se a pessoa deixar a lista aberta por mais de 5 min e clicar no PDF, o R2 responde
`403` (`Request has expired`). Sugestão: ao clicar em "ver PDF", se a listagem foi carregada há
mais de ~4 min, recarregue a página atual da lista (refetch) antes de abrir o link.

## 3. `GET /notifications` ganhou o campo `support`

Ações que a **plataforma** (painel admin/suporte) fez no município: criar município, criar usuário,
trocar nome/cargo e redefinir senha.

```json
"support": {
  "count": 1,
  "days": 30,
  "items": [
    {
      "id": "...",
      "action": "PLATFORM_USER_CREATED",
      "created_at": "2026-11-16T13:00:00.000Z",
      "target_id": "<id do usuário afetado>",
      "details": { "name": "FULANO", "role": "DEV", "source": "PLATAFORMA", "platformAdmin": "Nome do admin" }
    }
  ]
}
```

- Só vem preenchido para `SECRETARIO` e `DIRETOR`; para os outros cargos é `null`.
- **Não entra no `total`** (badge do sino). Mostre num campo próprio do dashboard.
- Cada ação aparece por `days` (30) dias e depois some; não há "lida".
- `action` pode ser `PLATFORM_TENANT_CREATED`, `PLATFORM_USER_CREATED`, `PLATFORM_USER_UPDATED`
  (`details` traz `userName` e `name`/`role` com `{ from, to }`) e `PLATFORM_USER_PASSWORD_RESET`
  (`details.userName`).
- No registro de atividade, `USER_CREATED` feito por um gestor agora traz `details.source: "MUNICIPIO"`
  (quem criou é o `user` do registro).

## 4. Abrir o PDF da APAC passa a ser registrado: `POST /apacs/:id/pdf/download-url`

Toda abertura do PDF de uma APAC (dado de paciente) fica no registro de atividade do município
(`APAC_PDF_VIEWED`, com quem abriu e quando). Para isso o link precisa ser pedido **no clique**:

```
POST /apacs/:id/pdf/download-url   (sem body; mesmos cargos de GET /apacs)
200 { "downloadUrl": "https://..." }   // vale 5 minutos
404 APAC não encontrada · 409 APAC sem PDF confirmado (has_pdf = false)
```

- No botão "ver PDF": chame a rota e abra o `downloadUrl` (ex.: `window.open`). Isso também resolve
  o link vencido da seção 2.
- **O `pdf_url` da listagem vai sair.** Ele continua vindo por enquanto, para não quebrar o front
  publicado, mas abrir por ele não fica registrado. Depois que o front migrar, a API remove o campo.
