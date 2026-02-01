## @scout/broadcast

This is a [Partykit](https://partykit.io) project. We use this to broadcast messages to all connected clients to let them know when data changes.

## Development

```bash
pnpm dev
```

## Deployment

```bash
pnpm deploy
```

After deploying, set `NEXT_PUBLIC_BROADCAST_HOST` in your environment to your PartyKit URL (e.g., `broadcast.your-project.partykit.dev`).
