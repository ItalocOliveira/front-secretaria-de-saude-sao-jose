/**
 * Abre o diálogo de impressão do navegador — é por ele que o usuário salva em PDF
 * ("Salvar como PDF"). Sem dependência extra e com o gráfico em vetor (SVG).
 *
 * - Força o tema claro enquanto imprime: os tokens do `.dark` dariam texto claro
 *   sobre papel branco.
 * - Troca o `document.title`, que o navegador usa como nome sugerido do arquivo.
 *
 * Tudo é restaurado no `afterprint`.
 */
export function printPage(fileTitle: string) {
  const root = document.documentElement
  const wasDark = root.classList.contains("dark")
  const previousTitle = document.title

  const restore = () => {
    document.title = previousTitle
    if (wasDark) {
      root.classList.remove("light")
      root.classList.add("dark")
    }
  }

  if (wasDark) {
    root.classList.remove("dark")
    root.classList.add("light")
  }
  document.title = fileTitle

  window.addEventListener("afterprint", restore, { once: true })
  window.print()
}
