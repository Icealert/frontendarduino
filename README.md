# Arduino IoT Dashboard

A modern, responsive web dashboard for monitoring and managing Arduino IoT devices. Built with Next.js, TypeScript, and TailwindCSS.

## Features

- 📱 Responsive design that works on desktop and mobile
- 📊 Real-time device monitoring
- 🔔 Live notifications for device alerts
- 📈 Historical data visualization
- ⚙️ Device settings management
- 🔐 Secure API token authentication

## Prerequisites

- Node.js 14.x or later
- npm 6.x or later
- Arduino IoT Cloud API token

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/arduino-iot-dashboard.git
cd arduino-iot-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Arduino IoT API token:
```env
NEXT_PUBLIC_ARDUINO_API_TOKEN=your_api_token_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

- `NEXT_PUBLIC_ARDUINO_API_TOKEN`: Your Arduino IoT Cloud API token

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run ESLint for code linting

## Project Structure

```
arduino-iot-dashboard/
├── src/
│   ├── api/           # API client and utilities
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Next.js pages
│   ├── styles/        # Global styles
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── public/           # Static files
└── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 