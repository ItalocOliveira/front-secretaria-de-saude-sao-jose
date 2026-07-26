import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Hooks e contexts do shadcn/ui vivem no mesmo arquivo do componente que
    // cria o React context. Extrair cada um exigiria mover o context junto,
    // divergindo do upstream a cada `shadcn add`. Constantes `cva` ficam em
    // `src/components/ui/variants/` e por isso não aparecem aqui.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        {
          allowExportNames: [
            'useCarousel',
            'useComboboxAnchor',
            'useDirection',
            'useMessageScroller',
            'useMessageScrollerScrollable',
            'useMessageScrollerVisibility',
            'useSidebar',
            'createToastManager',
            'toast',
            'useToastManager',
          ],
        },
      ],
    },
  },
])
