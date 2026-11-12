import { APAC_PROCEDURE_OPTIONS, type ApacProcedure } from "@/lib/apac"
import { matchesSearch } from "@/lib/search"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"

const PLACEHOLDER = "Selecione o procedimento"

/**
 * O filtro padrão do Base UI exige o texto contínuo ("oci xyz" não acha
 * "OCI - xyz"). Este ignora acentos/pontuação e aceita as palavras em qualquer ordem.
 */
function filterProcedure(option: (typeof APAC_PROCEDURE_OPTIONS)[number], query: string) {
  return matchesSearch(option.search, query)
}

/**
 * Campo de procedimento compartilhado entre criação e edição de APAC.
 *
 * A busca fica dentro do popup (e não no próprio campo): com um valor já
 * selecionado — caso da edição — o input exibia o texto do procedimento e não
 * parecia pesquisável. Assim os dois fluxos têm o mesmo campo de busca, vazio a
 * cada abertura.
 */
export function ApacProcedureCombobox({
  id,
  value,
  onValueChange,
  invalid = false,
}: {
  id: string
  value: ApacProcedure | ""
  onValueChange: (procedure: ApacProcedure | null) => void
  invalid?: boolean
}) {
  return (
    <Combobox
      items={APAC_PROCEDURE_OPTIONS}
      filter={filterProcedure}
      value={APAC_PROCEDURE_OPTIONS.find((option) => option.value === value) ?? null}
      onValueChange={(option) => onValueChange(option?.value ?? null)}
    >
      <ComboboxTrigger
        id={id}
        aria-invalid={invalid}
        render={<Button variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className="truncate">
          <ComboboxValue>{(option: { label: string } | null) => option?.label ?? PLACEHOLDER}</ComboboxValue>
        </span>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput showTrigger={false} placeholder="Busque o procedimento" />
        <ComboboxEmpty>Nenhum procedimento encontrado.</ComboboxEmpty>
        <ComboboxList>
          {(option: (typeof APAC_PROCEDURE_OPTIONS)[number]) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
