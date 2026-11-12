# 2026-11-13 — Município suspenso

Branch da API: `feat/painel-admin`. Mudança **aditiva**: nada quebra no front atual. Até a
primeira suspensão de um município, nenhuma tela vê diferença.

## O que muda

O operador da plataforma pode **suspender** um município pelo painel admin (por exemplo,
contrato encerrado). Enquanto ele estiver suspenso:

| Onde                      | Resposta da API                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `GET /auth/tenant`        | `200 { "name", "slug", "active": false }` (campo **novo** `active`; `true` nos demais casos) |
| `POST /auth/login`        | **`403`** `{ "message": "Acesso deste município suspenso. Procure o suporte do ICOS." }`     |
| Qualquer rota autenticada | `401` `{ "message": "Acesso deste município suspenso. Procure o suporte do ICOS." }`         |

Os dados não são apagados. Reativado, tudo volta como estava.

## O que fazer no front

1. **`TenantInfo` ganha `active: boolean`.** No `TenantGate`, com `active === false`, mostre uma
   tela própria no lugar do login, como a de "Município não encontrado":
   "O acesso de <nome> está suspenso. Procure o suporte do ICOS." Sem formulário de login.
2. **Login `403`:** mostre a `message` da API, que o `client.ts` já usa. Isso só acontece se o
   município for suspenso com a tela de login já aberta.
3. **`401` nas rotas:** nada a mudar. O `client.ts` já limpa a sessão e volta ao login, que agora
   cai na tela do item 1. Se quiser, mostre a `message` no aviso.

## Checklist

- [ ] `active` no tipo `TenantInfo`
- [ ] Tela "acesso suspenso" no `TenantGate` quando `active === false`
- [ ] Login mostra a mensagem do `403`
