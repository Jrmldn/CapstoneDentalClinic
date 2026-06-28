#15 [builder 5/5] RUN npm run build
#15 12.92 
#15 12.92 > capstone-dental-clinic@0.1.0 build
#15 12.92 > next build
#15 12.92
#15 14.10 ▲ Next.js 16.2.6 (Turbopack)
#15 14.10 
#15 14.15   Creating an optimized production build ...
#15 40.74 ✓ Compiled successfully in 26.4s
#15 40.74   Running TypeScript ...
#15 107.1   Finished TypeScript in 66s ...
#15 107.1   Collecting page data using 1 worker ...
#15 109.6   Generating static pages using 1 worker (0/34) ...
#15 111.2   Generating static pages using 1 worker (8/34) 
#15 111.6   Generating static pages using 1 worker (16/34) 
#15 111.7   Generating static pages using 1 worker (25/34) 
#15 111.9 ⨯ useSearchParams() should be wrapped in a suspense boundary at page "/update-password". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
#15 111.9     at S (/app/.next/server/chunks/ssr/node_modules_next_0w2y7fz._.js:2:2692)
#15 111.9     at r (/app/.next/server/chunks/ssr/node_modules_next_0w2y7fz._.js:4:6760)
#15 111.9     at f (/app/.next/server/chunks/ssr/_1155on-._.js:1:2443)
#15 111.9     at an (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:84267)
#15 111.9     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:86086)
#15 111.9     at al (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:107860)
#15 111.9     at ao (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:105275)
#15 111.9     at am (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:112789)
#15 111.9     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:98715)
#15 111.9     at al (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:107860)
#15 111.9 Error occurred prerendering page "/update-password". Read more: https://nextjs.org/docs/messages/prerender-error
#15 111.9 Export encountered an error on /update-password/page: /update-password, exiting the build.
#15 112.0 ⨯ Next.js build worker exited with code: 1 and signal: null
#15 112.1 npm notice
#15 112.1 npm notice New major version of npm available! 10.8.2 -> 11.17.0
#15 112.1 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.17.0
#15 112.1 npm notice To update run: npm install -g npm@11.17.0
#15 112.1 npm notice
#15 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
 > [builder 5/5] RUN npm run build:
111.9     at ai (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:98715)
111.9     at al (/app/node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.prod.js:2:107860)
111.9 Error occurred prerendering page "/update-password". Read more: https://nextjs.org/docs/messages/prerender-error
111.9 Export encountered an error on /update-password/page: /update-password, exiting the build.
112.0 ⨯ Next.js build worker exited with code: 1 and signal: null
112.1 npm notice
112.1 npm notice New major version of npm available! 10.8.2 -> 11.17.0
112.1 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.17.0
112.1 npm notice To update run: npm install -g npm@11.17.0
112.1 npm notice
------
[+] up 0/1
 - Image capstone-dental-clinic:latest Building                                                                                                                 361.5sDockerfile:37

--------------------

  35 |     ENV NEXT_TELEMETRY_DISABLED=1

  36 |

  37 | >>> RUN npm run build

  38 |

  39 |     # ============================================

--------------------

failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1