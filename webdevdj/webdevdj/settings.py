"""
Django settings for the Dongelek.kz project.

LOCAL DEVELOPMENT: nothing to configure, just run `python manage.py runserver`.

PRODUCTION (hosting): set the environment variables from .env.example.
DJANGO_ENV=production and DJANGO_SECRET_KEY are required.
Secrets are never stored in the code or in Git.
"""
import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent


def env_list(name, default=''):
    """A comma separated environment variable -> list."""
    return [item.strip() for item in os.environ.get(name, default).split(',') if item.strip()]


# --------------------------------------------------------------------------
# Mode, secret key, hosts
# --------------------------------------------------------------------------
IS_PRODUCTION = os.environ.get('DJANGO_ENV') == 'production'
DEBUG = not IS_PRODUCTION          # debug pages only on your own computer

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    if IS_PRODUCTION:
        raise ImproperlyConfigured('Set the DJANGO_SECRET_KEY environment variable.')
    # only for a laptop: this key is not used anywhere else
    SECRET_KEY = 'local-development-only-key-3f9c1a7e5b2d8046e1a9c7b3d5f20846'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]'] + env_list('DJANGO_ALLOWED_HOSTS')
if IS_PRODUCTION and len(ALLOWED_HOSTS) == 3:
    raise ImproperlyConfigured('Set DJANGO_ALLOWED_HOSTS (your domain), e.g. mysite.pythonanywhere.com')

# the address of the admin site of Django can be moved (less brute-force noise)
ADMIN_URL = os.environ.get('DJANGO_ADMIN_URL', 'admin/')


# --------------------------------------------------------------------------
# Application definition
# --------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'api',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',   # lets "log out" cancel the refresh token
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'webdevdj.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'webdevdj.wsgi.application'


# --------------------------------------------------------------------------
# Database
# --------------------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# --------------------------------------------------------------------------
# Passwords (also used by the registration, see api/views.py)
# --------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# --------------------------------------------------------------------------
# Internationalization, static files
# --------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'


# --------------------------------------------------------------------------
# CORS: which websites may call the API from a browser
# --------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env_list(
    'DJANGO_CORS_ORIGINS',
    'http://localhost:4200,http://127.0.0.1:4200' if DEBUG else '',
)
CSRF_TRUSTED_ORIGINS = env_list('DJANGO_CSRF_ORIGINS')


# --------------------------------------------------------------------------
# REST framework: JWT login + limits on the number of requests (anti brute force)
# --------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/min',        # a guest
        'user': '600/min',        # a logged in user
        'login': '10/min',        # login attempts from one IP address
        'register': '10/hour',    # new accounts from one IP address
        'phone': '30/hour',       # "Show phone" (protects against collecting numbers)
        'messages': '40/min',     # sending messages
    },
    # How many proxy servers are in front of Django. 0 = none (the real IP is used,
    # a fake X-Forwarded-For header cannot be used to avoid the limits).
    'NUM_PROXIES': int(os.environ.get('DJANGO_NUM_PROXIES', '0')),
}
if not DEBUG:
    # no "browsable API" web pages on the hosting, only JSON
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = ('rest_framework.renderers.JSONRenderer',)

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),   # refreshed automatically by the site
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'UPDATE_LAST_LOGIN': True,
}


# --------------------------------------------------------------------------
# HTTPS and cookies (only on the hosting)
# --------------------------------------------------------------------------
if IS_PRODUCTION:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = os.environ.get('DJANGO_SSL_REDIRECT', '1') == '1'
    SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_HSTS_SECONDS', '3600'))
    if os.environ.get('DJANGO_BEHIND_PROXY') == '1':
        # the hosting terminates HTTPS and tells Django about it
        SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
