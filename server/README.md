# Backend server for gemshine-connect-hub

Basic Node/Express + MongoDB backend scaffold.

Quick start

1. Change to the server folder:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in `MONGO_URI` and `JWT_SECRET`.

4. Start in development mode:

```bash
npm run dev
```

The server exposes a `/health` endpoint and connects to MongoDB using `MONGO_URI`.
