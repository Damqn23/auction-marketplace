# auctions/views/account.py

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class UserBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_account = request.user.account
        return Response({"balance": str(user_account.balance)}, status=200)
