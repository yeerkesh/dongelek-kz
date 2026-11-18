"""Limits for all forms of the site (one place, so they are easy to change).
The same numbers are used in the Angular forms (src/app/validation.ts)."""
import re
from datetime import date
from urllib.parse import urlparse
from rest_framework import serializers

YEAR_MIN = 1950
PRICE_MIN = 10_000
PRICE_MAX = 1_000_000_000
MILEAGE_MAX = 1_500_000
ENGINE_MIN = 0.1
ENGINE_MAX = 10.0
TITLE_MIN, TITLE_MAX = 3, 100
DESCRIPTION_MIN, DESCRIPTION_MAX = 10, 5000
CITY_MAX = 100
MESSAGE_MAX = 2000
USERNAME_MIN, USERNAME_MAX = 3, 30
PASSWORD_MIN, PASSWORD_MAX = 8, 128

USERNAME_RE = re.compile(r'^[\w.\-]+$')          # letters (also Cyrillic), digits, _ . -
PHONE_RE = re.compile(r'^\+?[\d\s\-()]{10,20}$')
CITY_RE = re.compile(r'^[^\d_!@#$%^&*+=<>?/\\|{}\[\]~`"]*$')   # no digits / symbols


def year_max():
    """The newest allowed model year: next year (new models appear early)."""
    return date.today().year + 1


def validate_year(value):
    if value < YEAR_MIN or value > year_max():
        raise serializers.ValidationError(f'Year must be between {YEAR_MIN} and {year_max()}.')
    return value


def validate_price(value):
    if value < PRICE_MIN or value > PRICE_MAX:
        raise serializers.ValidationError(f'Price must be between {PRICE_MIN} and {PRICE_MAX}.')
    return value


def validate_mileage(value):
    if value < 0 or value > MILEAGE_MAX:
        raise serializers.ValidationError(f'Mileage must be between 0 and {MILEAGE_MAX}.')
    return value


def validate_engine_volume(value):
    if value is not None and (value < ENGINE_MIN or value > ENGINE_MAX):
        raise serializers.ValidationError(f'Engine volume must be between {ENGINE_MIN} and {ENGINE_MAX}.')
    return value


def validate_title(value):
    value = ' '.join(value.split())
    if not TITLE_MIN <= len(value) <= TITLE_MAX:
        raise serializers.ValidationError(f'Title must have {TITLE_MIN}-{TITLE_MAX} characters.')
    return value


def validate_description(value):
    value = value.strip()
    if not DESCRIPTION_MIN <= len(value) <= DESCRIPTION_MAX:
        raise serializers.ValidationError(
            f'Description must have {DESCRIPTION_MIN}-{DESCRIPTION_MAX} characters.')
    return value


def validate_city(value):
    value = ' '.join((value or '').split())
    if len(value) > CITY_MAX or not CITY_RE.match(value):
        raise serializers.ValidationError('Invalid city name.')
    return value


def validate_phone(value):
    value = (value or '').strip()
    if not value:
        return value
    digits = re.sub(r'\D', '', value)
    if not PHONE_RE.match(value) or not 10 <= len(digits) <= 15:
        raise serializers.ValidationError('Invalid phone number.')
    return value


def validate_message_text(value):
    value = value.strip()
    if not value or len(value) > MESSAGE_MAX:
        raise serializers.ValidationError(f'Message must have 1-{MESSAGE_MAX} characters.')
    return value


def validate_http_url(value):
    """Photo links: only http:// and https:// (no ftp:, file:, javascript: ...)."""
    if urlparse(value).scheme not in ('http', 'https'):
        raise serializers.ValidationError('Only http:// and https:// links are allowed.')
    return value
