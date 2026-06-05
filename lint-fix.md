# ESLint Resolution & Refactoring Directives
When asked to fix linting errors in a file, you must strictly follow these rules to resolve the issues without breaking the application.

## 1. Strict Resolution Rules
* **Unexpected `any`:** Replace all instances of `any` with strict TypeScript interfaces. Do not use `@ts-ignore`.
* **State in Effects:** Fix cascading renders by removing `setState` from `useEffect` where possible. Initialize state directly in `useState` or extract the logic.
* **Missing Dependencies:** Include missing dependencies safely. Use `useCallback` if adding a function causes infinite renders.
* **Initialization Order:** Ensure all functions/variables are declared *before* they are called inside hooks.
* **Unescaped Entities:** Replace raw quotes in JSX with safe HTML entities (e.g., `&apos;`, `&quot;`).
* **Unused Variables:** Remove variables or imports that are entirely unused.

## 2. Core Guardrails (CRITICAL)
* **Zero Band-Aids:** Do NOT use `// eslint-disable-next-line` to bypass errors. Fix the actual structural issue.
* **Preserve Behavior:** Do not change business logic, UI layouts, or API endpoints. 
* **Preserve Styling:** Keep all existing Tailwind CSS utility classes exactly as they are.

## 3. Output Format
1. Briefly explain the root cause of the most severe error in the file.
2. Provide the fully refactored code.
3. Add a `// FIX:` comment next to the lines you changed.