from django.urls import path
from . import views
from .views import ProductList, ProductDetail, CartItemListCreateView, ProductCreateView, LogoutView, \
    CartItemRetrieveUpdateDestroyView, RegisterView, LoginView, CartAPIView, UserList, \
    UserDetailView, UserUpdateView, UserDeleteView, ProductDeleteView, \
    ProductUpdateView, OrganisationCreateView, OrganisationRetrieveUpdateDestroyView, \
    OrganisationListView, ProductReviewListCreateView, ProductReviewRetrieveUpdateDestroyView, \
    TwoFactorSetupView, TwoFactorLoginView, UserPaymentListCreateView, UserPaymentRetrieveUpdateDestroyView, \
    UserAddressListCreateView, UserAddressRetrieveUpdateDestroyView, get_common_passwords, get_csrf_token, \
    UserAccountView, CheckoutView, OrderListView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('users/', UserList.as_view(), name='user-list'),
    path('hello-world/', views.hello_world, name='hello_world'),
    path('products/', ProductList.as_view(), name='product-list'),
    path('manage-products/', ProductCreateView.as_view(), name='product-create'),
    path('products/<int:pk>/', ProductDetail.as_view(), name='product-detail'),
    path('cart/cart-items/', CartItemListCreateView.as_view(), name='cartitem-list-create'),
    path('cart/cart-items/<int:pk>/', CartItemRetrieveUpdateDestroyView.as_view(), name='cartitem-detail'),
    path('cart/', CartAPIView.as_view(), name='cart-read'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('organisations/', OrganisationListView.as_view(), name='organisation-list'),  # Updated this line
    path('manage-organisations/', OrganisationCreateView, name='organisation-create'),
    path('organisations/<int:pk>/', OrganisationRetrieveUpdateDestroyView.as_view(), name='organisation-detail'),
    path('user/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('account/', UserAccountView.as_view(), name='account_detail'),
    path('account/update/', UserUpdateView.as_view(), name='account_update'),
    path('account/delete/', UserDeleteView.as_view(), name='account_delete'),
    path('payments/', UserPaymentListCreateView.as_view(), name='user_payment_list_create'),
    path('payments/<int:pk>/', UserPaymentRetrieveUpdateDestroyView.as_view(), name='user_payment_detail'),
    path('addresses/', UserAddressListCreateView.as_view(), name='user_address_list_create'),
    path('addresses/<int:pk>/', UserAddressRetrieveUpdateDestroyView.as_view(), name='user_address_detail'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('orders/', OrderListView.as_view(), name='order_list'),
    path('products/add/', ProductCreateView.as_view(), name='product-add'),
    path('products/delete/<int:pk>/', ProductDeleteView.as_view(), name='product-delete'),
    path('products/update/<int:pk>/', ProductUpdateView.as_view(), name='product-update'),
    path('products/<int:pk>/reviews/', ProductReviewListCreateView.as_view(), name='product-review-list'),
    path('products/reviews/<int:pk>/', ProductReviewRetrieveUpdateDestroyView.as_view(), name='product-review-detail'),
    path('products/<int:pk>/reviews/', ProductReviewListCreateView.as_view(), name='product-reviews-list-create'),
    path('reviews/<int:pk>/', ProductReviewRetrieveUpdateDestroyView.as_view(), name='product-review-detail'),
    path('two-factor-setup/', TwoFactorSetupView.as_view(), name='two-factor-setup'),
    path('two-factor-login/', TwoFactorLoginView.as_view(), name='two-factor-login'),
    path('common-passwords/', get_common_passwords, name='get_common_passwords'),
    path('get_csrf_token/', get_csrf_token, name='get_csrf_token'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)