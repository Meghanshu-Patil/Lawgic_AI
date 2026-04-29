# ⚖️ Lawgic AI

Lawgic AI is a full-stack, AI-powered conversational assistant built on the MERN stack. Designed with a sleek, dark-mode, purple-accented user interface, it provides users with an intelligent chat experience featuring persistent semantic memory, real-time message streaming, and multimodal capabilities.

## 🚀 Key Features

- **Intelligent AI Conversations**: Powered by the Google Gemini API for highly accurate, context-aware responses.
- **Semantic Memory**: Integrates Pinecone Vector Database to store and retrieve past conversation embeddings, giving the AI long-term memory.
- **Real-Time Interaction**: Utilizes Socket.io for instantaneous message delivery and synchronized state.
- **Rich Text Rendering**: Frontend support for Markdown, ensuring structured, readable AI outputs including code blocks and tables.
- **Secure Authentication**: User registration and login flows protected by JWT (JSON Web Tokens) and bcrypt password hashing.
- **Multimodal Support**: Integrated with ImageKit and Multer to handle image uploads for vision-based queries.

## 💻 Tech Stack

### Frontend
- **React.js (Vite)**: Lightning-fast component rendering and development.
- **React Router**: Client-side routing for seamless navigation.
- **React Markdown**: Rich text formatting for AI responses.
- **Socket.io Client**: Real-time websocket connection to the backend.

### Backend
- **Node.js & Express.js**: Robust API and server infrastructure.
- **MongoDB & Mongoose**: NoSQL database for structured storage of Users and Chat Metadata.
- **Socket.io**: Real-time bidirectional event-based communication.
- **Google GenAI API**: LLM provider for natural language understanding and generation.
- **Pinecone**: Vector database for storing AI embeddings and enabling semantic search.
- **ImageKit**: Cloud image storage and optimization.

## 📂 Project Structure

```text
Lawgic_AI/
├── backend/                  # Express/Node.js Server
│   ├── src/
│   │   ├── controler/        # Request handlers (Auth, Chats, Upload)
│   │   ├── db/               # Database connection logic
│   │   ├── middleware/       # Custom Express middlewares
│   │   ├── models/           # Mongoose schemas (User, Chats, Messages)
│   │   ├── routes/           # Express API routes
│   │   ├── services/         # AI, Pinecone, and DB abstraction layers
│   │   └── socket/           # Real-time connection handlers
│   ├── .env                  # Backend environment variables
│   ├── package.json          # Backend dependencies
│   └── server.js             # Entry point
│
├── frontend/                 # React (Vite) Application
│   ├── src/
│   │   ├── assets/           # Static media assets
│   │   ├── pages/            # View components (Auth, Dashboard)
│   │   ├── App.jsx           # Root layout and theme wrapper
│   │   └── main.jsx          # React entry point
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite bundler config
│
└── README.md                 # Project Documentation
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Google Gemini API Key
- Pinecone API Key
- ImageKit API Keys

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Lawgic_AI
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_google_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

You need to run both the backend and frontend servers simultaneously.

**Run Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Run Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` in your browser to access the application.
