# Eventsy

Eventsy is a small app for finding and organising local events. You can browse events, RSVP, and see what you’re attending or hosting under **My Events**. If you organise an event, you can edit it and see who’s coming.

The frontend uses React, TypeScript and Tailwind CSS.

## Run it locally

Set up the database and start the FastAPI server on `http://127.0.0.1:8000` using the [backend setup instructions](../README.md).

In another terminal, run this from the project root.

```sh
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. The frontend calls FastAPI directly using CORS.

The draw.io planning diagrams are in [docs](../docs).
