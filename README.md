# Collaborative Text Editor

A real-time collaborative text editor built with Next.js, Socket.IO, and TypeScript. Multiple users can edit documents simultaneously in separate rooms with real-time synchronization and conflict resolution.

## 🌟 Features

### Room-Based Collaboration
- **Multiple Rooms**: Users can create or join different rooms for team separation
- **Room Isolation**: Each room maintains its own documents and user sessions
- **Predefined Rooms**: Quick access to common rooms (General, Team Alpha, Team Beta, Private)
- **Custom Rooms**: Create custom rooms with unique identifiers

### Real-Time Editing
- **Operational Transform (OT)**: Advanced conflict resolution algorithm for concurrent edits
- **Live Cursors**: See where other users are typing in real-time
- **Typing Indicators**: Know when other users are actively typing
- **User Presence**: See who's currently in your room

### Advanced Features
- **Conflict Resolution**: Automatic handling of concurrent edits using operational transformation
- **Activity Feed**: Track user actions (join, edit, leave)
- **User Colors**: Each user gets a unique color for easy identification
- **Character & Line Count**: Real-time document statistics

## 🏗️ Architecture

### Frontend (Next.js)
```
app/
├── editor/page.tsx         # Main editor page with room selector
├── page.tsx                # Landing page
└── layout.tsx              # App layout

components/
├── room-selector.tsx       # Room selection/creation UI
├── editor-content.tsx      # Text editing area
├── users-list.tsx          # Connected users sidebar
├── typing-indicator.tsx    # Typing status display
└── ui/                     # Reusable UI components

lib/
├── socket-manager.ts       # Socket.IO client management
├── operational-transform.ts # OT algorithm implementation
├── conflict-resolver.ts    # Conflict detection and resolution
└── utils.ts                # Utility functions
```

### Backend (Socket.IO Server)
```
server.ts                   # Main Socket.IO server
```

**Storage Structure:**
```
rooms (Map)
└── roomId (string)
    └── documents (Map)
        └── documentId (string)
            ├── content (string)
            ├── users (array)
            ├── operations (array)
            └── activities (array)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Greyma/Collaborative-text-editor.git
cd Collaborative-text-editor
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

You need to run **two servers** simultaneously:

#### 1. Start the Socket.IO Backend Server (Terminal 1)
```bash
npm run dev:server
```
This starts the Socket.IO server on port **3001**

#### 2. Start the Next.js Frontend (Terminal 2)
```bash
npm run dev
```
This starts the Next.js application on port **3000**

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

Then click "Try Editor" or go directly to:
```
http://localhost:3000/editor
```

## 📝 How to Use

### Creating or Joining a Room

1. Navigate to `/editor`
2. You'll see the room selector with options:
   - **Predefined Rooms**: Click on any available room to join instantly
   - **Custom Room**: Enter a unique room ID in the input field and click "Join Room"

### Collaborating in a Room

Once in a room:
1. Start typing in the editor
2. Your changes are instantly synchronized with other users in the same room
3. See other users' cursors and typing indicators
4. View connected users in the right sidebar
5. Users in different rooms cannot see each other's edits

### Room Isolation Example

**Scenario**: You have two teams working on different projects

1. **Team Alpha** joins room "team-alpha"
   - They can collaborate on their document
   - Only Team Alpha members see each other's edits

2. **Team Beta** joins room "team-beta"
   - They work on a separate document
   - Completely isolated from Team Alpha

## 🔧 Technical Details

### Operational Transform (OT)

The editor uses Operational Transform to handle concurrent edits:

**Operations:**
- `insert`: Add text at a position
- `delete`: Remove text from a position

**Transformation Rules:**
```javascript
// Example: Two users insert at the same position
User A: insert "Hello" at position 0
User B: insert "World" at position 0

// OT ensures both users converge to the same state
Result: "HelloWorld" or "WorldHello" (deterministic based on user ID)
```

### Conflict Resolution

The system detects and resolves conflicts using:
1. **Position-based transformation**: Adjust operation positions based on concurrent changes
2. **Timestamp ordering**: Break ties using operation timestamps
3. **User ID ordering**: Final tiebreaker for simultaneous operations

### Socket Events

**Client → Server:**
- `join`: Join a room and document
- `edit`: Send an edit operation
- `cursor`: Update cursor position
- `typing`: Update typing status
- `chat`: Send chat message (if implemented)
- `list-rooms`: Request list of available rooms

**Server → Client:**
- `document-sync`: Initial document state
- `users-updated`: Updated list of connected users
- `edit-received`: Remote edit operation
- `cursor-update`: Remote cursor position
- `typing-update`: Remote typing status
- `activity-update`: User activity notification
- `rooms-list`: Available rooms response

## 🛠️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001
```

For production, update to your deployed Socket.IO server URL.

### Port Configuration

**Backend Server** (server.ts):
```typescript
const PORT = process.env.PORT || 3001
```

**Frontend** (Next.js):
- Default: `http://localhost:3000`
- Configured in `next.config.mjs`

## 🧪 Testing Multi-User Collaboration

To test the room functionality:

1. Start both servers (backend and frontend)
2. Open `http://localhost:3000/editor` in **multiple browser tabs** or **different browsers**
3. Have each tab join the **same room** (e.g., "general")
4. Type in one tab and watch changes appear in others
5. Open another set of tabs and join a **different room** to verify isolation

## 📦 Project Scripts

```json
{
  "dev": "next dev",              // Start Next.js dev server
  "dev:server": "ts-node server.ts", // Start Socket.IO server
  "build": "next build",           // Build for production
  "start": "next start",           // Start production server
  "lint": "eslint ."               // Run linter
}
```

## 🏭 Production Deployment

### Frontend (Next.js)
Deploy to Vercel, Netlify, or any Node.js hosting:
```bash
npm run build
npm start
```

### Backend (Socket.IO)
Deploy to a separate server (e.g., Heroku, Railway, DigitalOcean):
```bash
node server.ts
```

**Important**: Update `NEXT_PUBLIC_SOCKET_URL` in your frontend deployment to point to your deployed Socket.IO server.

## 🔐 Security Considerations

- **Room Access**: Currently, any user can join any room. Consider adding authentication for production.
- **Data Persistence**: Documents are stored in memory. For production, implement database persistence.
- **Rate Limiting**: Add rate limiting to prevent spam or abuse.
- **Input Validation**: Validate all client inputs on the server.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Real-time communication via [Socket.IO](https://socket.io/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Happy Collaborating! 🎉**
