from django.urls import path
from . import views
from .views import ProductList, ProductDetail, CartItemListCreateView, ProductCreateView, LogoutView, \
    CartItemRetrieveUpdateDestroyView, CartAPIView, RegisterView, LoginView, \
    ProductCategoryCreateView, UserDetailView, UserUpdateView, UserDeleteView, ProductCreateView, ProductDeleteView, \
    ProductUpdateView, CategoryList, OrganisationCreateView, OrganisationRetrieveUpdateDestroyView, LoginView, \
    OrganisationListView, ProductReviewListCreateView, ProductReviewRetrieveUpdateDestroyView, \
    CartItemRetrieveUpdateDestroyView, CartAPIView, RegisterView, \
    OrganisationCreateView, OrganisationRetrieveUpdateDestroyView, LoginView, \
    ProductCategoryCreateView, UserDetailView, UserUpdateView, UserDeleteView, \
    OrganisationListView, ProductCreateView, ProductDeleteView, ProductUpdateView, \
    CategoryList, TwoFactorSetupView, TwoFactorLoginView, UserPaymentListCreateView, UserPaymentRetrieveUpdateDestroyView, \
    UserAddressListCreateView, UserAddressRetrieveUpdateDestroyView, get_common_passwords

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

from .views import UserList

urlpatterns = [
    path('users/', UserList.as_view(), name='user-list'),
    path('hello-world/', views.hello_world, name='hello_world'),
    path('products/', ProductList.as_view(), name='product-list'),
    path('manage-products/', ProductCreateView.as_view(), name='product-create'),
    path('manage-category/', ProductCategoryCreateView.as_view(), name='category-create'),
    path('products/<int:pk>/', ProductDetail.as_view(), name='product-detail'),
    path('cart/cart-items/', CartItemListCreateView.as_view(), name='cartitem-list-create'),
    path('cart/cart-items/<int:pk>/', CartItemRetrieveUpdateDestroyView.as_view(), name='cartitem-detail'),
    path('cart/', CartAPIView.as_view(), name='cart-read'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('organisations/', OrganisationListView.as_view(), name='organisation-list'),  # Updated this line
    path('manage-organisations/', OrganisationCreateView.as_view(), name='organisation-create'),
    path('organisations/<int:pk>/', OrganisationRetrieveUpdateDestroyView.as_view(), name='organisation-detail'),

    path('user/', UserDetailView.as_view(), name='user-detail'),  
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),

    path('account/', UserDetailView.as_view(), name='account_detail'),
    path('account/update/', UserUpdateView.as_view(), name='account_update'),
    path('account/delete/', UserDeleteView.as_view(), name='account_delete'),
    path('products/add/', ProductCreateView.as_view(), name='product-add'),
    path('categories/', CategoryList.as_view(), name='category-list'),
    path('products/delete/<int:pk>/', ProductDeleteView.as_view(), name='product-delete'),
    path('products/update/<int:pk>/', ProductUpdateView.as_view(), name='product-update'),
    # path('product-reviews/', views.ProductReviewListCreateView.as_view(), name='productreview-list'),
    # path('product-reviews/<int:pk>/', views.ProductReviewRetrieveUpdateDestroyView.as_view(), name='productreview-detail'),
    path('products/<int:pk>/', ProductDetail.as_view(), name='product-detail'),
    path('products/<int:pk>/reviews/', ProductReviewListCreateView.as_view(), name='product-review-list'),
    path('products/reviews/<int:pk>/', ProductReviewRetrieveUpdateDestroyView.as_view(), name='product-review-detail'),
    path('two-factor-setup/', TwoFactorSetupView.as_view(), name='two-factor-setup'),
    path('two-factor-login/', TwoFactorLoginView.as_view(), name='two-factor-login'),
    path('common-passwords/', get_common_passwords, name='get_common_passwords'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

