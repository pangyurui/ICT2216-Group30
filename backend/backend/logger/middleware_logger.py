from django.utils.deprecation import MiddlewareMixin
from logger.logging_library import log_exception, log_access

class LoggingMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        log_exception(request, exception)

    def process_response(self, request, response):
        page_name = request.path
        log_access(request, response, page_name)
        return response
