"""
Authentication views for Rentally API.
Handles user registration with role selection and custom JWT token generation.
"""

from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserRegisterSerializer


class RegisterAPIView(APIView):
    """
    POST /api/auth/register/

    Хэрэглэгч бүртгэх (buyer эсвэл broker).
    Role талбар заавал байх ёстой: 'user' эсвэл 'broker'.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        role = request.data.get('role', 'user')

        # Role validation
        if role not in ['user', 'broker']:
            return Response(
                {"error": "role must be either 'user' or 'broker'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Update user role directly (users table has role column)
            user.role = role
            user.save(update_fields=['role'])

            # If broker, create BrokerProfile
            if role == 'broker':
                from .models import BrokerProfile
                BrokerProfile.objects.create(
                    user=user,
                    company_name=request.data.get('company_name', ''),
                    registration_number=request.data.get('registration_number', ''),
                    description=request.data.get('description', ''),
                    status='pending'  # Broker-үүд pending статусаар эхэлнэ
                )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            # Add custom claims to token
            refresh['role'] = role
            refresh['username'] = user.username

            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': role,
                    'is_verified': user.is_verified,
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'message': 'Бүртгэл амжилттай. "broker" role сонгосон бол админ баталгаажуулалт хүлээнэ.' if role == 'broker' else 'Бүртгэл амжилттай.'
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginResponseAPIView(APIView):
    """
    POST /api/auth/login/

    Нэмэлт мэдээлэлтэй login (role, profile гэх мэт).
    Энгийн /api/token/-ийн оронд ашиглаж болно.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

        serializer = TokenObtainPairSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(
                {"error": "Нэвтрэх нэр эсвэл нууц үг буруу байна."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get user data
        user = User.objects.filter(username=request.data.get('username')).first()
        if not user:
            user = User.objects.filter(email=request.data.get('username')).first()

        if user:
            profile = user.profile
            role = profile.role

            # Create custom token with role
            refresh = RefreshToken.for_user(user)
            refresh['role'] = role
            refresh['username'] = user.username

            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': role,
                    'is_verified': profile.is_verified,
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            })

        return Response(serializer.validated_data)


class ChangePasswordAPIView(APIView):
    """
    POST /api/auth/change-password/

    Нууц үг солих (хэрэглэгч нэвтэрсэн байх ёстой).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password2 = request.data.get('new_password2')

        if not old_password or not new_password:
            return Response(
                {"error": "Хуучин болон шинэ нууц үг заавал оруулах ёстой."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != new_password2:
            return Response(
                {"error": "Шинэ нууц үг таарахгүй байна."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user

        # Check old password
        if not user.check_password(old_password):
            return Response(
                {"error": "Хуучин нууц үг буруу байна."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password
        if len(new_password) < 8:
            return Response(
                {"error": "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({
            "message": "Нууц үг амжилттай солигдлоо."
        })


class UserRoleInfoAPIView(APIView):
    """
    GET /api/auth/role/

    Одоогийн хэрэглэгчийн role мэдээлэл авах.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = user.profile

        data = {
            'user_id': user.id,
            'username': user.username,
            'role': profile.role,
            'is_verified': profile.is_verified,
        }

        # Broker бол нэмэлт мэдээлэл
        if profile.role == 'broker':
            try:
                broker = user.broker_profile
                data['broker_status'] = broker.status
                data['company_name'] = broker.company_name
            except:
                data['broker_status'] = 'pending'

        return Response(data)
