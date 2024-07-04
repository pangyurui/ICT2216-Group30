from django.contrib import admin
from django.urls import path, include # 👈 Add include here
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    # 👇 add your myapi app urls path here
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),   
    path('api/', include('api.urls'))
]+ static(settings.MEDIA_URL, document_root =settings.MEDIA_ROOT)