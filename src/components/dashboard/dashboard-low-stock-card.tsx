import { Link } from "react-router"
import { PackageCheckIcon } from "lucide-react"

import type { LowStockItemDto, NotificationsDto } from "@/api/notifications"
import type { ItensLocationState } from "@/lib/itens"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

const VISIBLE = 4

const SKELETON_ROWS = Array.from({ length: 3 }, (_, index) => index)

function stateFor(item: LowStockItemDto): ItensLocationState {
  return { search: item.name, itemId: item.id }
}

/** `lowStock` de `GET /notifications`: itens com `amount < min_amount`, menor quantidade primeiro. */
export function DashboardLowStockCard({ lowStock }: { lowStock: NotificationsDto["lowStock"] | undefined }) {
  const items = lowStock?.items.slice(0, VISIBLE) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estoque abaixo do mínimo</CardTitle>
        <CardDescription>
          {lowStock === undefined ? "Carregando…" : `${lowStock.count} itens precisam de reposição`}
        </CardDescription>
        <CardAction>
          <Link
            to="/almoxarifado"
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Almoxarifado
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {lowStock === undefined ? (
          <div className="flex flex-col gap-2">
            {SKELETON_ROWS.map((row) => (
              <Skeleton key={row} className="h-14 w-full" />
            ))}
          </div>
        ) : lowStock.count === 0 ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageCheckIcon />
              </EmptyMedia>
              <EmptyTitle>Estoque em dia</EmptyTitle>
              <EmptyDescription>Nenhum item abaixo da quantidade mínima.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-2">
            {items.map((item) => (
              // `outline`, não `muted`: o trilho do `Progress` é `bg-muted` e sumiria no fundo.
              <Item
                key={item.id}
                variant="outline"
                size="sm"
                render={<Link to="/almoxarifado" state={stateFor(item)} />}
              >
                <ItemContent className="min-w-0">
                  <ItemTitle className="w-full truncate">{item.name}</ItemTitle>
                  <Progress
                    value={item.min_amount === 0 ? 0 : Math.min((item.amount / item.min_amount) * 100, 100)}
                    aria-label={`${item.amount} de ${item.min_amount} (mínimo)`}
                    className="mt-1"
                  />
                </ItemContent>
                <ItemActions className="flex-col items-end gap-0">
                  <span className="font-semibold text-destructive tabular-nums">{item.amount}</span>
                  <ItemDescription className="tabular-nums">mín. {item.min_amount}</ItemDescription>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CardContent>
      {lowStock !== undefined && lowStock.count > items.length ? (
        <CardFooter className="text-[0.8125rem] text-muted-foreground">
          Mostrando {items.length} de {lowStock.count} · menor quantidade primeiro
        </CardFooter>
      ) : null}
    </Card>
  )
}
