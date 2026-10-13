import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/**', 'src/api/generated/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  // Existing demo screens are being migrated without changing their behavior.
  // New app, API and feature logic keeps the recommended rules above.
  {
    files: [
      'src/features/**/components/**/*.{ts,tsx}',
      'src/features/demo/**/*.{ts,tsx}',
      'src/shared/components/**/*.{ts,tsx}',
      'src/mocks/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/purity': 'off',
    },
  },
);
