# Security of Dongelek.kz

We checked the site the way an attacker would: automatic scanners **and** our own attacks on the API.
Everything below can be repeated:

```
cd webdevdj
python security_check.py        # 35 attacks on our own API (a temporary database is used)
```

## What was checked and what was found

| # | Check | Result before | What we did |
|---|-------|---------------|-------------|
| 1 | **Secret key** (it signs the login tokens) | **Critical.** It was written in the code and published on GitHub: anybody could forge a token of any user, also of an admin | The key is read from an environment variable. The code has no secrets. A new key must be created for the hosting |
| 2 | **Outdated packages** (`pip-audit`, `npm audit`) | **High.** Django 6.0.3 (35 known problems), PyJWT, urllib3, DRF; Angular 21.2.0 (15, among them XSS) | Updated to the patched versions (Django 6.1.3, DRF 3.18.3, PyJWT 2.15.1, Angular 21.2.26). Unused packages (`requests`, `urllib3`, ...) removed. Packages inside the website: 0 known problems |
| 3 | **Guessing passwords / spam** | No limits at all (25 wrong passwords in a row: nothing happened) | Limits per IP address: login 10/min, registration 10/hour, "Show phone" 30/hour, messages 40/min. A fake `X-Forwarded-For` header cannot be used to avoid them |
| 4 | **Weak passwords** | `12345678`, `password` were accepted | Django password rules: not common, not only digits, not similar to the login, at least 8 characters |
| 5 | **Log out** | The refresh token stayed valid after "Log out" | `POST /api/logout/` cancels it (token blacklist). Access token lives 30 minutes (was 60) |
| 6 | **Debug mode** | `DEBUG=True`: error pages show settings and the list of URLs | `DEBUG` is on only on a laptop; with `DJANGO_ENV=production` it is off and the API answers only JSON |
| 7 | **CORS** (which websites may read the API) | Any website | Only the listed addresses |
| 8 | **Photo links** | `ftp://` links were accepted | Only `http://` and `https://` |
| 9 | **Privacy of photo links** | Other sites that host the photos could see which page was opened | `referrer: no-referrer` in `index.html` |
| 10 | **Debug output** | Login errors were printed to the browser console | Removed |

## What was already good (tested, nothing to fix)

* **Access control:** a user cannot edit/delete other people's ads, read other people's messages or open the admin API; guests get 401, users get 403. The server checks the role itself, the buttons on the page are not the protection.
* **Mass assignment:** extra fields (`owner`, `is_staff`, `sender`, `is_read`, `views_count`) are ignored.
* **SQL injection:** all queries use the Django ORM; attack strings in search and filters are harmless.
* **XSS:** Angular escapes everything it shows; the username allows only letters, digits, `_ . -`.
* **Data leaks:** the public pages never show e-mails; the phone number is given only after "Show phone" (and is limited).
* **Blocked users** cannot log in; an admin cannot block, demote or delete himself.
* **Limits of all forms** are checked on the server too (year, price, mileage, lengths, phone, ...).
* Browser protection headers are on (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`).

## Known limits (honest list)

* The login token is kept in `localStorage` (a typical choice for a single-page site). Its risk is XSS, therefore we escape all output and keep the packages updated.
* After "Log out" the **access** token works until it expires (max. 30 minutes); only the refresh token is cancelled.
* The limits are counted in the memory of the server process. On a big hosting with many workers a shared cache (Redis) would be needed.
* The list of ads is not paged and the search reads all ads: fine for hundreds of ads, not for hundreds of thousands.
* 21 warnings of `npm audit` remain in the **build tools** (`glob`, `minimatch`, `uuid` inside Angular CLI). They are not part of the website that the browser receives.
* The site must be published with **HTTPS** (without it a password can be read in the network).

## What you must do before publishing

1. Set the environment variables from `.env.example` (`DJANGO_ENV=production`, a **new** `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`). Without them the server refuses to start.
2. Never commit the database, `.env` or keys (`.gitignore` is already prepared). The old key is public in the Git history: do not use it anywhere.
3. Use strong passwords for the admin accounts (`super`, `yerkesh`).
4. Run `python manage.py migrate` (the token blacklist adds its tables) and `npm install` (patched Angular).
