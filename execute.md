Got it. Since that is the only `index.ts` file in our codebase, let's clean it up completely as our first action item for Phase 4 to ensure total consistency across the project.

Please execute these standardization steps:
1. Move the `SuperadminStats` interface into a dedicated types file: `src/types/dashboard.ts`.
2. Move the remaining interfaces (`Clinic`, `AddClinicData`, `StaffData`, etc.) into `src/types/clinic.ts`.
3. Permanently remove that loose `index.ts` file.
4. Update our new services, actions, and dashboard views to import directly from these explicit absolute paths (e.g., `@/types/dashboard` and `@/types/clinic`).

Once those files are split, proceed immediately with the rest of your Phase 4 plan: audit all features for any remaining relative imports (`../../`), clean up any dead code/unused variables, and run `npx tsc --noEmit` to verify a 100% green build. 

Let me know as soon as the types are split and verified!