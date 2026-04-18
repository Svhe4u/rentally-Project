import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return
            
        self.user_group_name = f"user_{self.user.id}"
        
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if not self.user.is_anonymous:
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def chat_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps({
            "type": "chat.message",
            "message": message
        }))
