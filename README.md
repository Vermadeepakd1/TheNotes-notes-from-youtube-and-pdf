# TheNotes

TheNotes is a full-stack web application that converts lecture PDFs and YouTube videos into structured study notes. It is designed for students, competitive exam aspirants, and self-learners who want faster revision, clearer summaries, and exam-oriented question practice.

The project uses a single repository with two applications:

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + MongoDB

The UI is being built with inspiration from the Stitch design export in this repository, while the backend handles PDF parsing, YouTube transcript extraction, and AI-powered note generation.

## What the app does

- Upload a PDF and generate structured notes from the document content
- Paste a YouTube link and generate notes from the transcript
- Choose between summary, detailed, and exam-focused modes
- Generate key points, notes, and question sets in a single response
- Save and manage notes through authenticated user accounts
- Share notes through public links

## Core features

### Input handling

- PDF upload
- YouTube URL input
- Mode selection
- Exam question type selection

### Content extraction

- PDF text extraction with `pdf-parse`
- YouTube transcript extraction with `youtube-transcript`
- Text cleanup and normalization before AI processing

### AI generation

- Structured notes generation
- Key point extraction
- Question generation for practice and revision
- JSON-only response formatting for reliable rendering

### Output experience

- Notes view
- Key points view
- Questions view
- Loading and error states
- Shareable note pages

## Tech stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- Multer
- CORS
- Cookie-based auth

### AI and processing

- Google Gemini API as the primary LLM provider
- Groq API as the fallback provider
- `pdf-parse` for PDF extraction
- `youtube-transcript` for transcript retrieval

## Project structure

```text
yt2notes/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── app.js
├── stitch_exports/
└── README.md
```

## Architecture overview

```text
Frontend (React + Tailwind)
	↓
Backend (Node.js + Express)
	↓
Extraction layer
    ├── PDF parser
    └── YouTube transcript extractor
	↓
AI layer
    ├── Gemini primary provider
    └── Groq fallback provider
	↓
Structured JSON response
	↓
Frontend rendering
```

## Environment variables

Create a `.env` file in the backend folder with the following values:

```env
PORT=5000
FRONTEND_URL=http://127.0.0.1:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
COOKIE_NAME=smart_notes_token

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY=your_groq_api_key

NODE_ENV=development
```

The frontend can use an optional `.env` file as well:

```env
VITE_API_URL=http://127.0.0.1:5000/api
```

## Setup

### Prerequisites

- Node.js 18 or later
- MongoDB running locally or a MongoDB Atlas connection string
- A Google Gemini API key
- A Groq API key for fallback

### Install dependencies

Run the following commands from the repository root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Start the backend

```bash
cd backend
npm run dev
```

The backend runs on port `5000` by default.

### Start the frontend

```bash
cd frontend
npm run dev
```

The frontend runs on port `5173` by default.

## Available scripts

### Backend

- `npm run dev` - start the API in watch mode
- `npm start` - start the API normally

### Frontend

- `npm run dev` - start the Vite development server
- `npm run build` - create a production build
- `npm run preview` - preview the production build locally

## API summary

The backend exposes authenticated note routes, user auth routes, and public note routes.

### Health

- `GET /` - service status
- `GET /api/health` - health check

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Notes

- `GET /api/notes`
- `GET /api/notes/:noteId`
- `POST /api/notes/generate`
- `POST /api/notes/:noteId/regenerate`
- `PATCH /api/notes/:noteId/complete`
- `PATCH /api/notes/:noteId/archive`
- `DELETE /api/notes/:noteId`

### Public

- `GET /api/public/notes/:shareId`

## Note generation flow

1. The user uploads a PDF or pastes a YouTube link.
2. The backend extracts clean text from the source.
3. The extracted text is trimmed and prepared for the model.
4. Gemini generates structured JSON notes.
5. If Gemini fails, Groq is used as a fallback.
6. The response is normalized and stored as a note document.
7. The frontend renders notes, key points, and questions in tabs.

## AI provider strategy

- Gemini is the default provider because it is the primary configured model in the backend.
- Groq is used as a fallback when Gemini is unavailable or fails.
- The model output is forced into structured JSON so the UI can render it reliably.
- If the AI returns malformed JSON, the backend attempts a repair pass before failing.

## Functional scope

The current build supports:

- PDF to notes generation
- YouTube to notes generation
- Structured key points
- Viva and exam-style questions
- Authenticated note management
- Public share links for notes

## Non-functional goals

- Fast response time for short and medium documents
- Clear and intuitive interface
- Reliable extraction and generation flow
- Scalable API structure for future features

## UI direction

The frontend is intended to feel polished and presentation-ready:

- clean spacing and strong visual hierarchy
- modern card-based layout
- clear input and result states
- tabbed output for notes, key points, and questions
- smooth loading and error handling

## Development notes

- Keep large source inputs trimmed before sending them to the LLM.
- Prefer structured JSON responses over free-form text.
- Test PDF extraction and transcript extraction separately before testing the full flow.
- Keep the frontend and backend ports aligned with the environment variables above.

## Troubleshooting

- If the backend cannot connect to MongoDB, verify `MONGODB_URI` and network access.
- If AI generation fails, confirm `GEMINI_API_KEY` first, then `GROQ_API_KEY`.
- If the frontend cannot reach the backend, verify `VITE_API_URL` and `FRONTEND_URL`.
- If YouTube extraction fails, confirm the video has an available transcript.

## Future improvements

- Drag-and-drop file upload
- Better chunking for long PDFs
- Offline sample generation for demos
- Export to PDF or DOCX
- Richer question templates for exam preparation

## License

No license has been specified yet. Add one before publishing the project publicly.
