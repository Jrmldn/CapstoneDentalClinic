# Project ESLint Errors & Warnings Report

## 1. Global Summary
* **Total Problems:** 39
* **Errors:** 27
* **Warnings:** 12

---

## 2. Breakdown by File

### 📁 src/actions/managementActions.ts
* 🔴 **Line 276:46** | Unexpected any. Specify a different type `(@typescript-eslint/no-explicit-any)`
* 🔴 **Line 291:40** | Unexpected any. Specify a different type `(@typescript-eslint/no-explicit-any)`

### 📁 src/actions/personnelActions.ts
* ⚠️ **Line 5:10** | 'getClinics' is defined but never used `(@typescript-eslint/no-unused-vars)`
* 🔴 **Line 150:68** | Unexpected any. Specify a different type `(@typescript-eslint/no-explicit-any)`
* 🔴 **Line 160:77** | Unexpected any. Specify a different type `(@typescript-eslint/no-explicit-any)`
* 🔴 **Line 227:76** | Unexpected any. Specify a different type `(@typescript-eslint/no-explicit-any)`
* 🔴 **Line 298:85** | Unexpected any. Specify a different type `(@typescript-eslint/no-explicit-any)`
* 🔴 **Line 337:26** | Unexpected any. Specify a different type `(@typescript-eslint/no-explicit-any)`

### 📁 src/app/login/LoginForm.tsx
* 🔴 **Line 22:7** | Calling setState synchronously within an effect can trigger cascading renders `(react-hooks/set-state-in-effect)`
```typescript
  21 | if (errorData) {
  22 |   setIsErrorModalOpen(true) // Avoid calling setState() directly within an effect
  23 | }