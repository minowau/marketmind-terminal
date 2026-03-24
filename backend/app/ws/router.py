"""
MarketMind AI v2 — WebSocket Router & Redis Broadcast
Real-time streaming of simulation events, agent actions, and predictions.
Clients subscribe to channels (e.g., symbol:TATAMOTORS, global:simulation).
"""

import json
import asyncio
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

websocket_router = APIRouter()


class ConnectionManager:
    """Manage WebSocket connections and channel subscriptions."""

    def __init__(self):
        # channel_name -> set of WebSocket connections
        self.channels: Dict[str, Set[WebSocket]] = {}
        # websocket -> set of channel names
        self.subscriptions: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.subscriptions[websocket] = set()
        logger.info("websocket_connected", client=str(websocket.client))

    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection from all channels."""
        channels = self.subscriptions.pop(websocket, set())
        for channel in channels:
            if channel in self.channels:
                self.channels[channel].discard(websocket)
                if not self.channels[channel]:
                    del self.channels[channel]
        logger.info("websocket_disconnected", client=str(websocket.client))

    async def subscribe(self, websocket: WebSocket, channel: str):
        """Subscribe a WebSocket to a channel."""
        if channel not in self.channels:
            self.channels[channel] = set()
        self.channels[channel].add(websocket)
        self.subscriptions[websocket].add(channel)
        logger.info("websocket_subscribed", channel=channel)

    async def unsubscribe(self, websocket: WebSocket, channel: str):
        """Unsubscribe from a channel."""
        if channel in self.channels:
            self.channels[channel].discard(websocket)
        if websocket in self.subscriptions:
            self.subscriptions[websocket].discard(channel)

    async def broadcast_to_channel(self, channel: str, message: dict):
        """Send a message to all connections subscribed to a channel."""
        if channel not in self.channels:
            return

        dead_connections = set()
        for websocket in self.channels[channel]:
            try:
                await websocket.send_json(message)
            except Exception:
                dead_connections.add(websocket)

        # Clean up dead connections
        for ws in dead_connections:
            await self.disconnect(ws)

    async def broadcast_global(self, message: dict):
        """Broadcast to all connected clients (global channel)."""
        await self.broadcast_to_channel("global:simulation", message)

        # Also send to symbol-specific channel if applicable
        symbol = message.get("symbol")
        if symbol:
            await self.broadcast_to_channel(f"symbol:{symbol}", message)


# Singleton connection manager
manager = ConnectionManager()


async def redis_listener():
    """
    Background task: Subscribe to Redis pub/sub and forward messages
    to WebSocket clients. Gracefully handles Redis being unavailable.
    """
    import redis.asyncio as aioredis

    max_retries = 1
    retry_delay = 5

    for attempt in range(max_retries):
        try:
            redis_client = aioredis.from_url(settings.REDIS_URL)
            pubsub = redis_client.pubsub()
            await pubsub.subscribe("sim:events")

            logger.info("redis_pubsub_listener_started")

            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        await manager.broadcast_global(data)
                    except json.JSONDecodeError:
                        logger.warning("redis_invalid_json", data=str(message["data"])[:100])
                    except Exception as e:
                        logger.error("redis_broadcast_error", error=str(e))

        except Exception as e:
            logger.warning(
                "redis_listener_unavailable",
                error=str(e),
                attempt=attempt + 1,
                max_retries=max_retries,
            )
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (attempt + 1))
            else:
                logger.info("redis_listener_giving_up_no_redis_available")
                return


@websocket_router.websocket("/simulation")
async def websocket_simulation(websocket: WebSocket):
    """
    WebSocket endpoint for real-time simulation events.

    Client can send JSON messages to subscribe to channels:
        {"action": "subscribe", "channel": "symbol:TATAMOTORS"}
        {"action": "subscribe", "channel": "global:simulation"}
        {"action": "unsubscribe", "channel": "symbol:TATAMOTORS"}

    Server pushes events:
        {"type": "agent_action", "agent_id": "...", "symbol": "...", ...}
        {"type": "prediction", "symbol": "...", "buy_probability": ..., ...}
    """
    await manager.connect(websocket)

    # Auto-subscribe to global channel
    await manager.subscribe(websocket, "global:simulation")

    try:
        while True:
            # Wait for client messages (subscribe/unsubscribe)
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                action = message.get("action")
                channel = message.get("channel", "")

                if action == "subscribe" and channel:
                    await manager.subscribe(websocket, channel)
                    await websocket.send_json({
                        "type": "subscribed",
                        "channel": channel,
                    })
                elif action == "unsubscribe" and channel:
                    await manager.unsubscribe(websocket, channel)
                    await websocket.send_json({
                        "type": "unsubscribed",
                        "channel": channel,
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Unknown action. Use 'subscribe' or 'unsubscribe'.",
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON",
                })

    except WebSocketDisconnect:
        await manager.disconnect(websocket)
