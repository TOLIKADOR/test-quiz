const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Game state
const parties = new Map();
const players = new Map();

// Sample quiz questions
const quizQuestions = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctAnswer: 3
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"],
    correctAnswer: 1
  },
  {
    id: 5,
    question: "What is the chemical symbol for gold?",
    options: ["Ag", "Au", "Fe", "Cu"],
    correctAnswer: 1
  },
  {
    id: 6,
    question: "Which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2
  },
  {
    id: 7,
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    correctAnswer: 2
  },
  {
    id: 8,
    question: "Which country is home to the kangaroo?",
    options: ["New Zealand", "Australia", "South Africa", "India"],
    correctAnswer: 1
  },
  {
    id: 9,
    question: "What is the main component of the sun?",
    options: ["Liquid lava", "Molten iron", "Hot gases", "Solid rock"],
    correctAnswer: 2
  },
  {
    id: 10,
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 1
  }
];

// Game class
class Game {
  constructor(partyId) {
    this.partyId = partyId;
    this.players = new Map();
    this.currentQuestionIndex = 0;
    this.gameState = 'waiting'; // waiting, playing, finished
    this.scores = new Map();
    this.answers = new Map();
    this.questionStartTime = null;
    this.questionTimer = null;
  }

  addPlayer(playerId, playerName) {
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      score: 0,
      ready: false
    });
    this.scores.set(playerId, 0);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    this.scores.delete(playerId);
    this.answers.delete(playerId);
  }

  isReady() {
    return this.players.size >= 2 && Array.from(this.players.values()).every(p => p.ready);
  }

  startGame() {
    this.gameState = 'playing';
    this.currentQuestionIndex = 0;
    this.scores.clear();
    this.answers.clear();
    
    // Reset scores
    for (let [playerId, player] of this.players) {
      this.scores.set(playerId, 0);
    }
    
    this.nextQuestion();
  }

  nextQuestion() {
    if (this.currentQuestionIndex >= quizQuestions.length) {
      this.endGame();
      return;
    }

    const question = quizQuestions[this.currentQuestionIndex];
    this.questionStartTime = Date.now();
    this.answers.clear();

    // Send question to all players
    io.to(this.partyId).emit('question', {
      questionIndex: this.currentQuestionIndex + 1,
      totalQuestions: quizQuestions.length,
      question: question.question,
      options: question.options,
      timeLimit: 15000 // 15 seconds
    });

    // Set timer for question
    this.questionTimer = setTimeout(() => {
      this.processAnswers();
    }, 15000);
  }

  submitAnswer(playerId, answerIndex) {
    if (this.gameState !== 'playing') return;
    
    const question = quizQuestions[this.currentQuestionIndex];
    const isCorrect = answerIndex === question.correctAnswer;
    
    this.answers.set(playerId, {
      answerIndex,
      isCorrect,
      timeTaken: Date.now() - this.questionStartTime
    });

    // Award points based on speed and correctness
    if (isCorrect) {
      const timeBonus = Math.max(0, 15 - Math.floor((Date.now() - this.questionStartTime) / 1000));
      const points = 10 + timeBonus;
      this.scores.set(playerId, this.scores.get(playerId) + points);
    }

    // Check if all players have answered
    if (this.answers.size === this.players.size) {
      clearTimeout(this.questionTimer);
      this.processAnswers();
    }
  }

  processAnswers() {
    const question = quizQuestions[this.currentQuestionIndex];
    const results = [];

    for (let [playerId, player] of this.players) {
      const answer = this.answers.get(playerId);
      results.push({
        playerId,
        playerName: player.name,
        answer: answer ? answer.answerIndex : null,
        isCorrect: answer ? answer.isCorrect : false,
        score: this.scores.get(playerId)
      });
    }

    io.to(this.partyId).emit('questionResult', {
      questionIndex: this.currentQuestionIndex + 1,
      correctAnswer: question.correctAnswer,
      results
    });

    // Move to next question after 3 seconds
    setTimeout(() => {
      this.currentQuestionIndex++;
      this.nextQuestion();
    }, 3000);
  }

  endGame() {
    this.gameState = 'finished';
    
    // Determine winner
    let winner = null;
    let highestScore = -1;
    let tie = false;

    for (let [playerId, score] of this.scores) {
      if (score > highestScore) {
        highestScore = score;
        winner = playerId;
        tie = false;
      } else if (score === highestScore) {
        tie = true;
      }
    }

    const finalResults = [];
    for (let [playerId, player] of this.players) {
      finalResults.push({
        playerId,
        playerName: player.name,
        score: this.scores.get(playerId)
      });
    }

    io.to(this.partyId).emit('gameEnd', {
      winner: tie ? null : winner,
      winnerName: tie ? null : this.players.get(winner)?.name,
      tie,
      finalResults
    });
  }
}

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createParty', (data) => {
    const partyId = uuidv4().substring(0, 8).toUpperCase();
    const game = new Game(partyId);
    parties.set(partyId, game);
    
    socket.join(partyId);
    players.set(socket.id, { partyId, playerName: data.playerName });
    
    game.addPlayer(socket.id, data.playerName);
    
    socket.emit('partyCreated', {
      partyId,
      partyCode: partyId,
      playerName: data.playerName
    });
    
    console.log(`Party created: ${partyId} by ${data.playerName}`);
  });

  socket.on('joinParty', (data) => {
    const partyId = data.partyCode.toUpperCase();
    const game = parties.get(partyId);
    
    if (!game) {
      socket.emit('error', { message: 'Party not found' });
      return;
    }
    
    if (game.players.size >= 2) {
      socket.emit('error', { message: 'Party is full' });
      return;
    }
    
    socket.join(partyId);
    players.set(socket.id, { partyId, playerName: data.playerName });
    
    game.addPlayer(socket.id, data.playerName);
    
    socket.emit('partyJoined', {
      partyId,
      playerName: data.playerName
    });
    
    // Notify all players in the party
    io.to(partyId).emit('playerJoined', {
      playerName: data.playerName,
      playerCount: game.players.size
    });
    
    console.log(`${data.playerName} joined party: ${partyId}`);
  });

  socket.on('playerReady', () => {
    const player = players.get(socket.id);
    if (!player) return;
    
    const game = parties.get(player.partyId);
    if (!game) return;
    
    const playerData = game.players.get(socket.id);
    if (playerData) {
      playerData.ready = true;
    }
    
    // Check if game can start
    if (game.isReady()) {
      io.to(player.partyId).emit('gameStarting', { countdown: 3 });
      
      setTimeout(() => {
        game.startGame();
      }, 3000);
    }
  });

  socket.on('submitAnswer', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    const game = parties.get(player.partyId);
    if (!game) return;
    
    game.submitAnswer(socket.id, data.answerIndex);
  });

  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      const game = parties.get(player.partyId);
      if (game) {
        game.removePlayer(socket.id);
        
        // Notify other players
        io.to(player.partyId).emit('playerLeft', {
          playerName: player.playerName,
          playerCount: game.players.size
        });
        
        // If no players left, clean up the party
        if (game.players.size === 0) {
          parties.delete(player.partyId);
          console.log(`Party ${player.partyId} cleaned up`);
        }
      }
      
      players.delete(socket.id);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/parties', (req, res) => {
  const partyList = Array.from(parties.keys()).map(partyId => ({
    partyId,
    playerCount: parties.get(partyId).players.size,
    gameState: parties.get(partyId).gameState
  }));
  res.json(partyList);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to play the game`);
});
