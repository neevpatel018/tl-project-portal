# First staff/admin setup

1. Create the first staff member through Supabase Authentication (invite them, or use the approved university onboarding process).
2. Have the project owner run this in the Supabase SQL Editor, replacing the email with the exact account email:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where lower(email) = lower('approved-admin@university.example'));
```

3. Verify the profile is active and the person can access staff-only routes.
4. Add at least two administrators, require MFA for staff accounts, and document an offboarding process.
5. Never make staff role selection available on public registration forms.
