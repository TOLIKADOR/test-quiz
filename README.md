# 🎮 Multiplayer Quiz Game

A real-time multiplayer quiz game built with Node.js, Express, and Socket.io. Challenge your friends in exciting quiz battles with instant feedback and live scoring!

## ✨ Features

- **Real-time Multiplayer**: Play with friends in real-time using WebSocket connections
- **Party System**: Create or join game parties with unique codes
- **Live Scoring**: Real-time score tracking with speed bonuses
- **6 Questions per Game**: 3 categories with 2 questions each, different point values
- **Timer System**: 15-second time limit per question with visual countdown
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Cross-platform**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone or download the project files**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Visit `http://localhost:3000`
   - The game will be ready to play!

## 🎯 How to Play

### Creating a Party
1. Click "Create Party" on the main menu
2. Enter your name
3. Click "Create Party"
4. Share the generated party code with your friend

### Joining a Party
1. Click "Join Party" on the main menu
2. Enter your name and the party code
3. Click "Join Party"

### Gameplay
1. Both players must click "I'm Ready!" to start
2. Answer questions within 15 seconds
3. Questions are from 3 categories: Geography, Science, and History
4. Each question has different point values (10-35 points)
5. Faster correct answers earn bonus points
6. After 6 questions, the winner is announced!

## 🏗️ Architecture

### Backend Components

- **Express Server**: HTTP server with REST API endpoints
- **Socket.io**: Real-time WebSocket communication
- **Game Logic**: Manages party creation, player matching, and scoring
- **Question System**: Pre-defined quiz questions with multiple choice answers

### Frontend Components

- **Responsive Design**: Works on all device sizes
- **Real-time Updates**: Live score tracking and question progression
- **Interactive UI**: Smooth animations and user feedback
- **Party Management**: Easy party creation and joining

## 📡 API Endpoints

- `GET /api/health` - Server health check
- `GET /api/parties` - List all active parties
- `GET /` - Main game interface

## 🔌 WebSocket Events

### Client to Server
- `createParty` - Create a new game party
- `joinParty` - Join an existing party
- `playerReady` - Mark player as ready to start
- `submitAnswer` - Submit answer to current question

### Server to Client
- `partyCreated` - Confirmation of party creation
- `partyJoined` - Confirmation of joining party
- `playerJoined` - Notification when player joins
- `gameStarting` - Game countdown start
- `question` - New question data
- `questionResult` - Question results and scores
- `gameEnd` - Final game results
- `error` - Error messages

## 🎨 Customization

### Adding New Questions
Edit the `quizCategories` object in `server.js`:

```javascript
geography: {
  name: "Geography",
  questions: [
    {
      id: 7,
      question: "Your new question here?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 2,  // Index of correct answer (0-based)
      points: 20  // Points for this question
    }
  ]
}
```

### Modifying Game Settings
- **Questions per game**: Change the number of questions in each category
- **Time limit**: Modify `timeLimit` in `nextQuestion()` method
- **Scoring**: Adjust point values in each question object
- **Categories**: Add or modify categories in the `quizCategories` object

## 🛠️ Development

### Project Structure
```
multiplayer-quiz-game/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── public/
│   └── index.html     # Frontend interface
└── README.md          # This file
```

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restart on file changes.

## 🌐 Deployment

### Local Network
To play with friends on your local network:
1. Find your computer's IP address
2. Start the server: `npm start`
3. Friends can access: `http://YOUR_IP:3000`

### Cloud Deployment
The app can be deployed to platforms like:
- Heroku
- Vercel
- Railway
- DigitalOcean

Set the `PORT` environment variable for production deployment.

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in server.js or set environment variable
   PORT=3001 npm start
   ```

2. **Socket.io connection issues**
   - Check firewall settings
   - Ensure CORS is properly configured
   - Verify client is connecting to correct server URL

3. **Players can't join party**
   - Verify party code is correct (case-sensitive)
   - Check if party is full (max 2 players)
   - Ensure both players are on same server

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to contribute by:
- Adding new questions
- Improving the UI/UX
- Adding new features
- Fixing bugs
- Improving documentation

---

**Enjoy playing the multiplayer quiz game! 🎉**
