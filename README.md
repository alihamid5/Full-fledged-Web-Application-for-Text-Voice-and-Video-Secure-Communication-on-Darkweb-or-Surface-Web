# Advanced Chat Application

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A full-featured, secure chat application built with React, TypeScript, and Material UI. This application provides real-time messaging, file sharing, voice/video calls, and comprehensive admin controls.

## 🌟 Features

### Core Functionality
- **Real-time Messaging**: Instant messaging with typing indicators and read receipts
- **File Sharing**: Send and preview images, videos, documents, and other files
- **Voice & Video Calls**: WebRTC-powered high-quality audio and video calling
- **Screen Sharing**: Share your screen during video calls

### User Management
- **User Authentication**: Secure login/registration system
- **User Profiles**: Customize profiles with avatars and status messages
- **Contact Management**: Add, remove, and block contacts

### Admin Features
- **Admin Dashboard**: Monitor system usage with analytics
- **User Management**: Create, edit, suspend, or delete user accounts
- **System Settings**: Configure application-wide settings

### Security Features
- **End-to-End Encryption**: Secure message transmission
- **Authentication System**: Protect user accounts and data
- **Role-Based Access Control**: Restrict feature access based on user permissions

## 📋 Prerequisites

- Node.js (v16.x or higher)
- npm (v8.x or higher) or yarn (v1.22.x or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/advanced-chat-app.git
   cd advanced-chat-app
   ```

2. Install dependencies:
   ```bash
   # Client setup
   cd chat-app/client
   npm install
   
   # Server setup
   cd ../server
   npm install
   ```

3. Set up environment variables:
   
   Create a `.env` file in the client directory:
   ```
   REACT_APP_API_URL=http://localhost:3001
   ```
   
   Create a `.env` file in the server directory:
   ```
   PORT=3001
   JWT_SECRET=your_secret_key_here
   MONGODB_URI=mongodb://localhost:27017/chatapp
   ```

### Running the Application

1. Start the server:
   ```bash
   cd chat-app/server
   npm run dev
   ```

2. Start the client:
   ```bash
   cd chat-app/client
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

### Demo Credentials

- **Regular User**: 
  - Email: test@example.com
  - Password: password123

- **Admin User**:
  - Email: admin@example.com
  - Password: admin123

## 🔒 Deploying as a Tor Hidden Service (Onion Site)

For maximum privacy and security, you can deploy this chat application as a Tor hidden service, making it accessible only through the Tor network.

### Why Use Tor?

- **Enhanced Privacy**: Communication remains within the Tor network
- **End-to-End Encryption**: Extra layer of protection beyond the app's built-in security
- **Circumvention of Censorship**: Bypass network restrictions and censorship
- **Hidden Location**: Server's physical location remains concealed

### Setup Instructions

1. Install Tor on your server:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install tor
   ```

2. Configure Tor as a hidden service:
   
   Edit the Tor configuration file:
   ```bash
   sudo nano /etc/tor/torrc
   ```
   
   Add the following lines:
   ```
   HiddenServiceDir /var/lib/tor/chat_service/
   HiddenServicePort 80 127.0.0.1:3001
   HiddenServicePort 5173 127.0.0.1:5173
   ```

3. Restart Tor:
   ```bash
   sudo systemctl restart tor
   ```

4. Get your .onion address:
   ```bash
   sudo cat /var/lib/tor/chat_service/hostname
   ```

5. Update your client to use WebSocket connections compatible with Tor:
   
   In your client's `constants.ts` file:
   ```typescript
   export const API_URL = process.env.REACT_APP_API_URL || 'http://youronionaddress.onion';
   export const SOCKET_URL = API_URL;
   ```

6. Configure your server to listen only on localhost:
   
   In your server's `.env` file:
   ```
   HOST=127.0.0.1
   PORT=3001
   ```

7. Run your application servers and access through the Tor Browser at:
   ```
   http://youronionaddress.onion
   ```

### Security Considerations for Tor Deployment

- Use HTTPS for connections when possible
- Enable strict CORS policies
- Implement rate limiting to prevent DoS attacks
- Regular security audits are essential
- Consider using a dedicated server for your Tor hidden service

## 📱 Mobile Compatibility

The application is fully responsive and works on:
- Desktop browsers
- Mobile browsers
- Can be installed as a Progressive Web App (PWA)

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Material UI
- Socket.io-client
- WebRTC

### Backend
- Node.js
- Express
- Socket.io
- MongoDB

## 🔧 Advanced Configuration

### Custom Theming

You can modify the theme in `src/App.tsx`:

```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Change to your desired primary color
    },
    secondary: {
      main: '#f50057', // Change to your desired secondary color
    },
  },
});
```

### Environment Variables

Additional environment variables for the client:
```
REACT_APP_SOCKET_URL=your_socket_url
REACT_APP_MAX_FILE_SIZE=10485760
```

Additional environment variables for the server:
```
NODE_ENV=production
CORS_ORIGIN=your_client_domain
MONGODB_URI=your_mongodb_connection_string
S3_BUCKET=your_aws_s3_bucket_name
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Your Name ([@yourusername](https://github.com/yourusername))

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📌 Disclaimer

This application is provided for legitimate communication purposes only. The creators are not responsible for any misuse of this software or deploying it in a way that violates laws or regulations in your jurisdiction.

The Tor hidden service deployment instructions are provided for educational purposes and to support legitimate privacy needs. Users are responsible for complying with all applicable laws when using this software. 