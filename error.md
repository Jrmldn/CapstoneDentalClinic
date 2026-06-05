## Error Type
Build Error

## Error Message
the name `isErrorModalOpen` is defined multiple times

## Build Output
./src/app/login/LoginForm.tsx:21:10
the name `isErrorModalOpen` is defined multiple times
  19 |
  20 |   // FIX: Initializing state directly from searchParams to avoid cascading renders in useEffect
> 21 |   const [isErrorModalOpen, setIsErrorModalOpen] = useState(!!errorData)
     |          ^^^^^^^^^^^^^^^^
  22 |
  23 |   const redirectTo = clinicId
  24 |     ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?clinic=${clinicId}`

Ecmascript file had an error

Import trace:
  Server Component:
    ./src/app/login/LoginForm.tsx
    ./src/app/login/page.tsx

Next.js version: 16.2.6 (Turbopack)
