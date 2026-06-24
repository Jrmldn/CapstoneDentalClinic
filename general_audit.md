Conduct a comprehensive audit of this codebase.
Check for:
Exposed API keys, SQL injection vulnerabilities, XSS vulnerabilities, insecure Supabase configurations, 
unprotected routes, insecure client-side code, potential data leaks, any other security vulnerabilities, 
insecure data storage, missing input validation. for each issue explain it, and tell me exactly how to fix it,
make the output as clear and detailed as possible, i want a clean and professional output. also format it well.

Audit the authentication in this codebase. can a logged-out user access anything they shouldn't? can one user access another user's data by changing a URL? are any routes only protected on the frontend but not the backend? explain any issues in plain English and tell me how to fix them. make the output as clear and detailed as possible, i want a clean and professional output. also format it well.

Review this codebase for data privacy issues. tell me: what user data is being collected and stored, how it's protected, whether sensitive data is encrypted, whether I'm GDPR compliant, and whether any third-party services are receiving user data without consent. flag anything that could be a legal risk. make the output as clear and detailed as possible, i want a clean and professional output. also format it well.