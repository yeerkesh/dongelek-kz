"""Limits on the number of requests (protection against password guessing, spam and scraping).
The numbers are in settings.py (REST_FRAMEWORK -> DEFAULT_THROTTLE_RATES)."""
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle


class IPRateThrottle(SimpleRateThrottle):
    """Counts the requests of one IP address (also when the person is logged in)."""

    def get_cache_key(self, request, view):
        return self.cache_format % {'scope': self.scope, 'ident': self.get_ident(request)}


class LoginThrottle(IPRateThrottle):
    scope = 'login'


class RegisterThrottle(IPRateThrottle):
    scope = 'register'


class PhoneThrottle(IPRateThrottle):
    scope = 'phone'


class MessageThrottle(SimpleRateThrottle):
    """Limits sending messages (reading them is not limited by this rule)."""
    scope = 'messages'

    def get_cache_key(self, request, view):
        if request.method != 'POST':
            return None
        ident = request.user.pk if request.user and request.user.is_authenticated else self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


# the usual limits for guests and users are kept on the special views too
DEFAULT_THROTTLES = [AnonRateThrottle, UserRateThrottle]
