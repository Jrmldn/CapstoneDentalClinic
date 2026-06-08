Refactor the following monolithic React component. Make it highly modular, clean, DRY, and performant while strictly adhering to the architectural practices and rules below.

1. Architecture & Maintainability
Separation of Concerns: Keep UI, logic, and data handling in distinct layers. Extract all business logic, data fetching, and side effects (like useEffect) into custom hooks. The main component should only be responsible for rendering the UI.

Component Modularity: Break down large or complex UI sections into smaller, single-responsibility sub-components.

Constants Extraction: Move any hardcoded values, magic numbers, or static configuration objects into a separate constants.ts file.

Eliminate Redundancy: Remove duplicate logic (DRY principle), group related code together, and delete any dead or unused code.

2. Readability & Consistency
Naming: Use clear, descriptive variable and function names.

Self-Documenting Code: Remove redundant comments and replace them with code that explains itself.

Consistency: Follow a consistent coding style throughout. Standardize error handling and loading state patterns.

3. Performance & Typing
Optimization: Identify and fix unnecessary re-renders, redundant API calls, or expensive operations. Optimize loops, conditionals, and data transformations.

Strict Typing: Ensure all extracted functions, hooks, and new component props have strict, well-defined TypeScript interfaces. Do not use any.

4. Strict Rules
Preserve Functionality: Do not change existing functionality or behavior. The output must work exactly the same as the original.

Preserve APIs: Do not rename public-facing API endpoints, props, or event names.

Preserve Styling: Keep the existing Tailwind CSS utility classes intact, ensuring they are properly applied to the newly created sub-components.

Flag Bugs: Point out anything that looks like a bug or code smell, but do not fix it unless explicitly told to.

5. Output Format
Please output the refactored code logically, file by file (e.g., constants.ts, custom hooks, sub-components, and the main component).

Requirement: Add a brief comment above each refactored file or major section explaining exactly what changed and why.