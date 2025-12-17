# Devnovate X HackWithIndia

A comprehensive hackathon platform that brings together organizers and participants in a collaborative environment. Built with modern web technologies for seamless real-time interaction and community building.

## 🚀 Features

### 🎯 Core Platform Features
- **Dual Role System**: Separate interfaces for organizers and participants
- **Real-time Authentication**: Secure login/signup with case-insensitive email matching
- **Responsive Design**: Mobile-first approach with beautiful UI/UX

### 👥 User Management
- **Profile System**: Complete user profiles with avatar uploads
- **Profile Cards**: Clickable user avatars throughout the platform
- **Profile Modals**: Detailed user information in elegant modal windows
- **Avatar Upload**: Custom avatar support with image handling

### 💬 Communication & File Sharing
- **Real-time Messaging**: Advanced messaging system with instant updates powered by Supabase
- **Unlimited File Storage**: Cloud-based file storage with Supabase Storage
- **Smart File Compression**: Automatic image compression and optimization
- **Large File Support**: Upload files up to 50MB per file
- **Multiple File Types**: Images, documents, videos, audio, ZIP files, and more
- **Secure File Access**: Role-based file access with download protection
- **File Management**: Track storage usage and manage attachments
- **CDN Delivery**: Fast file downloads from Supabase CDN
- **Message Management**: Edit and delete your own messages
- **Message Search**: Find conversations quickly with built-in search
- **Unread Tracking**: Visual indicators for unread messages
- **Message Threading**: Organized conversation flows
- **File Download**: Download shared files with one click

### 📢 Announcements & Updates
- **Announcement Hub**: Centralized announcement system
- **Unread Notifications**: Track unread announcements
- **Rich Content**: Support for images and formatted content
- **Real-time Updates**: Instant announcement delivery

### 🏆 Hackathon Management
- **Event Creation**: Rich hackathon creation with image uploads
- **Event Discovery**: Browse and explore hackathons
- **Event Details**: Comprehensive hackathon information pages
- **Status Tracking**: Real-time event status updates

### 📝 Content Creation
- **Rich Blog Editor**: Advanced text editor with formatting options
- **Image Support**: Upload and embed images in blogs
- **Full-screen Viewer**: Modal image viewing experience
- **Content Sharing**: Native share API with clipboard fallback

### 🐛 Issue Management
- **Issue Tracking**: Comprehensive issue reporting system
- **Issue Cards**: Detailed issue information with user context
- **Status Management**: Track issue resolution progress with closed/resolved states
- **Comment Moderation**: Organizers can delete inappropriate comments
- **Closed Issue Protection**: Prevent comments on closed issues
- **Community Collaboration**: Collaborative problem-solving

### 🎨 UI/UX Features
- **Theme System**: Dark/light mode with smooth transitions
- **Glass Effects**: Modern glassmorphism design elements
- **Animations**: Smooth transitions and hover effects
- **Responsive Layout**: Optimized for all device sizes

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library

### Backend & Storage
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase Storage** - Unlimited file storage with CDN
- **Supabase Auth** - Secure authentication and user management
- **Real-time Subscriptions** - Live updates and notifications
- **Row Level Security** - Secure data access policies

### State Management
- **React Context** - Authentication and theme management
- **Custom Hooks** - Reusable logic for data fetching
- **Supabase Client** - Real-time data synchronization

### UI Components
- **Lucide React** - Beautiful icon library
- **Sonner** - Toast notifications
- **Custom Components** - Tailored UI elements

### Development Tools
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing
- **TypeScript Config** - Strict type checking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
Navigate to `http://localhost:5173`

## 📱 Platform Usage

### For Organizers
1. **Dashboard Access**: Comprehensive event management dashboard
2. **Create Hackathons**: Rich content creation with image uploads
3. **Manage Announcements**: Post updates and communicate with participants
4. **Monitor Engagement**: Track participant activity and feedback

### For Participants
1. **Browse Events**: Discover hackathons and join communities
2. **Real-time Chat**: Communicate with organizers and other participants
3. **Share Content**: Create blogs and share experiences
4. **Report Issues**: Contribute to platform improvement

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components (Header, Sidebar)
│   ├── blog/           # Blog-related components
│   ├── dashboard/      # Dashboard components
│   ├── hackathon/      # Hackathon components
│   └── issues/         # Issue tracking components
├── contexts/           # React contexts (Auth, Theme)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── data/               # Sample data and constants
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient for main actions
- **Secondary**: Complementary accent colors
- **Muted**: Subtle backgrounds and text
- **Success/Warning/Error**: Semantic colors

### Typography
- **Headings**: Bold, gradient text for emphasis
- **Body**: Readable font sizes with proper contrast
- **Code**: Monospace for technical content

### Components
- **Glass Effects**: Translucent backgrounds with blur
- **Cards**: Elevated surfaces with hover effects
- **Buttons**: Multiple variants (default, outline, ghost, hero)
- **Forms**: Consistent input styling with validation

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured for React and TypeScript
- **Prettier**: Code formatting (if configured)

### Performance Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Responsive images with proper loading
- **Bundle Analysis**: Optimized build output

## 🚀 Deployment

### Supabase Setup (Required for Production)

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com and create a new project
   # Note your project URL and anon key
   ```

2. **Configure Environment Variables**
   ```bash
   # Create .env file
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Database Migrations**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login and link project
   supabase login
   supabase link --project-ref your-project-ref
   
   # Push migrations
   supabase db push
   ```

4. **Configure Storage Buckets**
   - The migrations automatically create required storage buckets
   - Buckets: `message-attachments`, `user-avatars`, `blog-images`, `hackathon-media`, `issue-attachments`

### Frontend Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to hosting platform**
   ```bash
   # Vercel
   npm install -g vercel
   vercel --prod
   
   # Netlify
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

### Recommended Platforms
- **Vercel**: Zero-config deployment with environment variables
- **Netlify**: Continuous deployment from Git with form handling
- **Railway**: Full-stack deployment with database support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the excellent component library
- **Lucide** for beautiful icons
- **Tailwind CSS** for the utility-first CSS framework
- **React Team** for the amazing framework

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review the demo credentials for testing

---

**Built with ❤️ for the developer community**
