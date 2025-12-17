import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Users, Code, Zap, Globe, Rocket, MessageCircle, Calendar, Shield, Award, ChevronRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useHackathons } from '@/hooks/useHackathons';
import { toast } from 'sonner';

type AppRole = 'organizer' | 'participant';

export default function Index() {
  const { user, signIn, signUp, isOrganizer } = useAuth();
  const { hackathons } = useHackathons();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role] = useState<AppRole>('participant');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          navigate(isOrganizer ? '/dashboard' : '/hackathons');
        }
      } else {
        if (!name.trim()) {
          toast.error('Please enter your name');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name, role);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created successfully!');
          navigate(role === 'organizer' ? '/dashboard' : '/hackathons');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Hackathons Hosted', value: `${hackathons.length}+`, icon: Trophy },
    { label: 'Developers', value: '10,000+', icon: Users },
    { label: 'Projects Built', value: '5,000+', icon: Code },
  ];

  const features = [
    {
      icon: Rocket,
      title: 'Organize Hackathons',
      description: 'Create community spaces with rich content editor, image uploads, and comprehensive event management.',
    },
    {
      icon: MessageCircle,
      title: 'Advanced File Sharing',
      description: 'Unlimited file sharing with automatic compression, cloud storage, and support for images, documents, and media files up to 50MB.',
    },
    {
      icon: Users,
      title: 'Profile Management',
      description: 'Complete user profiles with avatar uploads, clickable profile cards, and comprehensive user information.',
    },
    {
      icon: Calendar,
      title: 'Announcements Hub',
      description: 'Stay updated with live announcements, unread tracking, and organized communication channels.',
    },
    {
      icon: Shield,
      title: 'Issue Tracking',
      description: 'Comprehensive issue management with detailed cards, user information, and collaborative problem-solving.',
    },
    {
      icon: Globe,
      title: 'Blog Platform',
      description: 'Rich blog editor with image support, full-screen viewing, and native sharing capabilities.',
    },
  ];

  const platformBenefits = [
    { 
      title: 'For Organizers', 
      items: [
        'Create hackathon spaces with rich content',
        'Post announcements with image support',
        'Manage comprehensive dashboards',
        'Upload event posters and media',
        'Track participant engagement'
      ] 
    },
    { 
      title: 'For Participants', 
      items: [
        'Browse hackathons with detailed views',
        'Real-time messaging with unlimited file sharing',
        'Share blogs with rich editor',
        'Report and track issues',
        'Connect through profile system'
      ] 
    },
  ];

  if (user) {
    navigate(isOrganizer ? '/dashboard' : '/hackathons');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/devnovatelogo.png" 
                alt="Devnovate" 
                className="h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <span className="text-muted-foreground font-bold">X</span>
            <div className="flex items-center gap-2">
              <img 
                src="/assets/hackwithindialogo.png" 
                alt="HackWithIndia" 
                className="h-8 w-8 object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                <Trophy className="h-5 w-5 text-secondary-foreground" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/hackathons">
              <Button variant="ghost">Explore</Button>
            </Link>
            <Button variant="hero" onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-primary">India's Premier Hackathon Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Build. <span className="gradient-text">Innovate.</span> Win.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Complete hackathon platform with unlimited file sharing, real-time messaging, rich content creation, profile management, and comprehensive community features.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}>
                Start Your Journey
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Link to="/hackathons">
                <Button variant="outline" size="xl">
                  Browse Hackathons
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-6 text-center card-hover">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Benefits */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Join the <span className="gradient-text">Revolution</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Whether you're an organizer looking to host hackathons or a developer ready to showcase your skills, we've got you covered.
              </p>
              
              <div className="space-y-6">
                {platformBenefits.map((benefit) => (
                  <div key={benefit.title} className="glass rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      {benefit.title}
                    </h3>
                    <ul className="space-y-2">
                      {benefit.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-muted-foreground">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Auth Form */}
            <div className="glass rounded-2xl p-8">
              <div className="flex gap-2 mb-8">
                <Button
                  variant={isLogin ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setIsLogin(true)}
                >
                  Login
                </Button>
                <Button
                  variant={!isLogin ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setIsLogin(false)}
                >
                  Sign Up
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>


                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to <span className="gradient-text">succeed</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools organizers and participants need for a seamless hackathon experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="glass rounded-2xl p-8 card-hover group">
                <div className="h-14 w-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Hackathons */}
      {hackathons.length > 0 && (
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Upcoming Hackathons</h2>
                <p className="text-muted-foreground">Join the next big innovation challenge</p>
              </div>
              <Link to="/hackathons">
                <Button variant="glow">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hackathons.slice(0, 3).map((hackathon) => (
                <div key={hackathon.id} className="glass rounded-2xl overflow-hidden card-hover group">
                  {hackathon.image_url ? (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={hackathon.image_url} 
                        alt={hackathon.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-2 bg-gradient-primary" />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-info/20 text-info text-xs font-medium">
                        {hackathon.status}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                        {hackathon.mode}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {hackathon.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {hackathon.description}
                    </p>
                    <div className="flex items-center justify-end">
                      <span className="text-primary font-bold">{hackathon.prizes[0] || 'TBA'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Platform Highlights */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Platform <span className="gradient-text">Highlights</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the powerful features that make our platform unique
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              {
                title: 'Advanced Messaging',
                description: 'Real-time chat with search, unread tracking, and instant notifications',
                features: ['Message search', 'Unread counts', 'Real-time updates', 'User profiles']
              },
              {
                title: 'Rich Content Creation',
                description: 'Powerful blog editor with image support and sharing capabilities',
                features: ['Rich text editor', 'Image uploads', 'Full-screen viewer', 'Native sharing']
              },
              {
                title: 'Comprehensive Profiles',
                description: 'Complete user management with avatars and detailed information',
                features: ['Avatar uploads', 'Profile cards', 'Modal views', 'User interactions']
              },
              {
                title: 'Issue Management',
                description: 'Collaborative problem-solving with detailed tracking',
                features: ['Issue cards', 'Status tracking', 'User context', 'Community solutions']
              },
              {
                title: 'Event Organization',
                description: 'Full hackathon lifecycle management with rich content',
                features: ['Event creation', 'Image support', 'Status updates', 'Participant tracking']
              },
              {
                title: 'Real-time Updates',
                description: 'Live announcements and notifications across the platform',
                features: ['Instant updates', 'Unread tracking', 'Rich content', 'Organized feeds']
              }
            ].map((highlight) => (
              <div key={highlight.title} className="glass rounded-2xl p-6 card-hover">
                <h3 className="text-xl font-bold mb-3">{highlight.title}</h3>
                <p className="text-muted-foreground mb-4">{highlight.description}</p>
                <ul className="space-y-1">
                  {highlight.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 relative bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              About <span className="gradient-text">Us</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the organizations behind India's most comprehensive hackathon platform
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Devnovate */}
            <div className="glass rounded-3xl p-8 card-hover">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="/assets/devnovatelogo.png" 
                  alt="Devnovate Logo" 
                  className="h-12 object-contain"
                  onError={(e) => {
                    // Fallback to icon if logo not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold gradient-text">Devnovate</h3>
                  <p className="text-sm text-muted-foreground">Where Innovation Meets Collaboration</p>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Discover, join, organize hackathons and tech events on the most comprehensive platform for developers and innovators. 
                Devnovate empowers the tech community by providing cutting-edge tools and fostering collaborative environments 
                where breakthrough ideas come to life.
              </p>

              <div className="flex gap-3">
                <a 
                  href="https://www.instagram.com/devnovate.co?igsh=ejN3b21yeDczamFl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.linkedin.com/company/devnovate/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="mailto:info.devnovate@gmail.com"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* HackWithIndia */}
            <div className="glass rounded-3xl p-8 card-hover">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="/assets/hackwithindialogo.png" 
                  alt="HackWithIndia Logo" 
                  className="h-12 w-12 object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback to icon if logo not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <Trophy className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">HackWithIndia</h3>
                  <p className="text-sm text-muted-foreground">India's Biggest Hackathon Community</p>
                </div>
              </div>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Collaborate and innovate to build something awesome!</strong> 
                  All monetary prizes will be split equally among the winning team members.
                </p>
                <p>
                  HackWithIndia is India's largest and most impactful hackathon community. With a mission to foster 
                  innovation, collaboration, and learning, HackWithIndia has become a hub for tech enthusiasts, 
                  developers, and creative problem-solvers across the country.
                </p>
                <p>
                  In just 10 months, HackWithIndia has organized <strong className="text-foreground">over 20 high-energy hackathons</strong>, 
                  solidifying its role as a driving force in India's rapidly growing tech ecosystem.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <a 
                  href="https://www.instagram.com/hackwithindia?igsh=MTBxbjZhenFlaW93MA==" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-secondary text-secondary-foreground hover:shadow-glow transition-all"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.linkedin.com/company/hackwithindia/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-secondary text-secondary-foreground hover:shadow-glow transition-all"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="mailto:hackwithindia2@gmail.com"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-secondary text-secondary-foreground hover:shadow-glow transition-all"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Sign Up', desc: 'Create your account as organizer or participant' },
              { step: '02', title: 'Explore', desc: 'Browse hackathons or create your own event' },
              { step: '03', title: 'Connect', desc: 'Chat with participants and post announcements' },
              { step: '04', title: 'Succeed', desc: 'Win prizes and build your portfolio' },
            ].map((item, index) => (
              <div key={item.step} className="text-center relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="glass rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to make your mark?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of developers and organizers who trust Devnovate X HackWithIndia to build the future.
              </p>
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Devnovate Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/assets/devnovatelogo.png" 
                  alt="Devnovate" 
                  className="h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg gradient-text">Devnovate</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering innovation through technology and community-driven development.
              </p>
              <div className="flex gap-3">
                <a 
                  href="https://www.instagram.com/devnovate.co?igsh=ejN3b21yeDczamFl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.linkedin.com/company/devnovate/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="mailto:info.devnovate@gmail.com"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* HackWithIndia Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/assets/hackwithindialogo.png" 
                  alt="HackWithIndia" 
                  className="h-8 w-8 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                  <Trophy className="h-5 w-5 text-secondary-foreground" />
                </div>
                <span className="font-bold text-lg">HackWithIndia</span>
              </div>
              <p className="text-sm text-muted-foreground">
                India's premier hackathon community fostering innovation and collaboration.
              </p>
              <div className="flex gap-3">
                <a 
                  href="https://www.instagram.com/hackwithindia?igsh=MTBxbjZhenFlaW93MA==" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-secondary hover:text-secondary-foreground transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.linkedin.com/company/hackwithindia/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-secondary hover:text-secondary-foreground transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="mailto:hackwithindia2@gmail.com"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-secondary hover:text-secondary-foreground transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Platform Links */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/hackathons" className="text-muted-foreground hover:text-primary transition-colors">
                    Browse Hackathons
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                    Community Blog
                  </Link>
                </li>
                <li>
                  <Link to="/issues" className="text-muted-foreground hover:text-primary transition-colors">
                    Issue Tracker
                  </Link>
                </li>
                <li>
                  <Link to="/announcements" className="text-muted-foreground hover:text-primary transition-colors">
                    Announcements
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Community</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Join Platform
                  </button>
                </li>
                <li>
                  <span className="text-muted-foreground">Organizer Portal</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Developer Hub</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Support Center</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img 
                    src="/assets/devnovatelogo.png" 
                    alt="Devnovate" 
                    className="h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden flex h-6 w-6 items-center justify-center rounded bg-primary">
                    <Zap className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <span className="text-muted-foreground font-bold">X</span>
                <div className="flex items-center gap-2">
                  <img 
                    src="/assets/hackwithindialogo.png" 
                    alt="HackWithIndia" 
                    className="h-6 w-6 object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden flex h-6 w-6 items-center justify-center rounded bg-secondary">
                    <Trophy className="h-4 w-4 text-secondary-foreground" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>© 2024 All rights reserved</span>
                <div className="flex items-center gap-1">
                  <span>Built with</span>
                  <span className="text-red-500">❤️</span>
                  <span>for developers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
