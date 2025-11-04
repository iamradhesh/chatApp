# 🚀 Real-Time Chat Application

A scalable, production-ready real-time chat application built with MERN stack, RabbitMQ, and microservices architecture. Fully deployed on AWS with enterprise-level features.

![Chat Application Demo](https://via.placeholder.com/800x400?text=Real-Time+Chat+Application)

## 🌟 Features

- ⚡ **Real-time Messaging** with Socket.IO
- 🔐 **OTP-based Email Authentication**
- 🏗️ **Microservices Architecture** for scalability
- 🐰 **RabbitMQ** for inter-service communication
- ⚡ **Redis Caching** for enhanced performance
- 🌐 **AWS Deployment** with production infrastructure
- 📱 **Responsive UI** built with React.js
- 🔄 **Scalable & Modular** backend design
- 🐳 **Dockerized Services** for easy deployment

## 🏗️ Architecture

This application follows a microservices architecture pattern similar to scalable platforms like Uber Eats:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   User Service  │    │   Chat Service  │
│   (React.js)    │◄──►│   (Node.js)     │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │              ┌─────────────────┐                │
         │              │   RabbitMQ      │◄───────────────┘
         │              │   (Message Bus) │
         │              └─────────────────┘
         │                        │
    ┌─────────────────┐    ┌─────────────────┐
    │   Redis Cache   │    │   MongoDB       │
    │   (Caching)     │    │   (Database)    │
    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React.js** - Component-based UI library
- **Socket.IO Client** - Real-time communication
- **React Context API** - State management
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type safety

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### Infrastructure
- **RabbitMQ** - Message broker for microservices
- **Redis** - In-memory caching
- **Docker** - Containerization
- **AWS EC2** - Cloud hosting
- **AWS Load Balancer** - Traffic distribution
- **AWS RDS** - Managed database service

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Docker & Docker Compose
- MongoDB
- Redis
- RabbitMQ

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/realtime-chat-app.git
   cd realtime-chat-app
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install user service dependencies
   cd ../user-service
   npm install
   
   # Install chat service dependencies
   cd ../chat-service
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Start individual services**
   ```bash
   # Start user service
   cd user-service
   npm run dev
   
   # Start chat service (new terminal)
   cd chat-service
   npm run dev
   
   # Start frontend (new terminal)
   cd frontend
   npm start
   ```

## 📁 Project Structure

```
realtime-chat-app/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utility functions
│   └── public/
├── user-service/            # User authentication microservice
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   └── utils/           # Utility functions
│   └── Dockerfile
├── chat-service/            # Chat functionality microservice
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Database models
│   │   ├── socket/          # Socket.IO handlers
│   │   └── utils/           # Utility functions
│   └── Dockerfile
├── docker-compose.yml       # Docker services configuration
├── nginx.conf              # Nginx configuration
└── README.md
```

## 🔧 Environment Variables

### User Service (.env)
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp_users
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
EMAIL_SERVICE_API_KEY=your_email_api_key
```

### Chat Service (.env)
```bash
PORT=5002
MONGODB_URI=mongodb://localhost:27017/chatapp_chats
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
```

## 🔐 Authentication Flow

1. User enters email address
2. OTP sent via email service
3. User verifies OTP
4. JWT token generated and stored
5. Protected routes accessible with valid token

## 📡 API Endpoints

### User Service (Port 5000)
```
POST /api/v1/auth/send-otp     # Send OTP to email
POST /api/v1/auth/verify-otp   # Verify OTP and login
GET  /api/v1/me                # Get current user info
POST /api/v1/users/search      # Search users
```

### Chat Service (Port 5002)
```
GET  /api/v1/chats            # Get user chats
POST /api/v1/chats            # Create new chat
GET  /api/v1/chats/:id        # Get chat messages
POST /api/v1/messages         # Send message
```

## 🔌 Socket.IO Events

### Client → Server
- `join_chat` - Join a chat room
- `send_message` - Send a new message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

### Server → Client
- `message_received` - New message received
- `user_typing` - Another user is typing
- `user_online` - User came online
- `user_offline` - User went offline

## 🐳 Docker Deployment

Build and run with Docker Compose:

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## ☁️ AWS Deployment

### Infrastructure Components
- **EC2 Instances** - Application servers
- **Application Load Balancer** - Traffic distribution
- **RDS MongoDB** - Managed database
- **ElastiCache Redis** - Managed caching
- **Amazon MQ** - Managed RabbitMQ

### Deployment Steps
1. Set up EC2 instances with Docker
2. Configure Load Balancer with health checks
3. Set up RDS for MongoDB
4. Configure ElastiCache for Redis
5. Set up Amazon MQ for RabbitMQ
6. Deploy using CI/CD pipeline

## 🔄 Microservices Communication

Services communicate via RabbitMQ message queues:

- **User Events** - User registration, profile updates
- **Chat Events** - New chats, message notifications
- **Notification Events** - Real-time notifications

## 🎯 Performance Optimizations

- **Redis Caching** - Cache frequently accessed data
- **Connection Pooling** - Efficient database connections
- **Message Queuing** - Async processing with RabbitMQ
- **Load Balancing** - Distribute traffic across instances
- **CDN Integration** - Serve static assets efficiently

## 🧪 Testing

```bash
# Run frontend tests
cd frontend && npm test

# Run user service tests
cd user-service && npm test

# Run chat service tests
cd chat-service && npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Socket.IO team for real-time communication
- RabbitMQ for reliable message queuing
- AWS for cloud infrastructure
- MongoDB for flexible data storage

## 📞 Support

If you have any questions or need help with setup, feel free to:
- Open an issue on GitHub
- Reach out via email: radhesh185@gmail.com


---
⭐ Star this repository if you found it helpful!
Built with ❤️ by Radhesh

