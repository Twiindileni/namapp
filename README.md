# NamApp - Namibian App Store

A modern web platform for discovering and sharing Android applications created by Namibian developers.

## Features

- 🚀 Modern Next.js 14 application with TypeScript
- 🔥 Firebase Authentication and Firestore Database
- 📱 APK file upload and management
- 👥 User profiles and developer dashboards
- 🔍 Advanced search and filtering
- 📊 Download tracking and analytics
- 🎨 Beautiful UI with Tailwind CSS
- 🔒 Secure file storage with Firebase Storage

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Superbase (Authentication, Suoerbase, Storage)
- **Deployment**: Vercel

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Twiindileni/namapp.git
   cd namapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
├── types/           # TypeScript type definitions
└── utils/           # Helper functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Cleo Thomas - [@cleothomas](https://twitter.com/your_twitter)

Project Link: [https://github.com/Twiindileni/namapp](https://github.com/Twiindileni/namapp)
