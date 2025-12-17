// Sample data for testing - Add this to localStorage initialization
// This demonstrates how the JSON storage system works

export const sampleInitializationData = {
  users: {
    'user_1702832400000': {
      id: 'user_1702832400000',
      email: 'organizer@devnovate.com',
      password: 'organizer123', // In production, this should be hashed
      name: 'Devnovate Organizer',
      createdAt: '2025-12-17T08:00:00Z'
    },
    'user_1702832500000': {
      id: 'user_1702832500000',
      email: 'participant1@example.com',
      password: 'participant123',
      name: 'Alex Johnson',
      createdAt: '2025-12-17T08:05:00Z'
    },
  },
  profiles: {
    'user_1702832400000': {
      id: 'user_1702832400000',
      user_id: 'user_1702832400000',
      email: 'organizer@devnovate.com',
      name: 'Devnovate Organizer',
      avatar_url: null
    },
    'user_1702832500000': {
      id: 'user_1702832500000',
      user_id: 'user_1702832500000',
      email: 'participant1@example.com',
      name: 'Alex Johnson',
      avatar_url: null
    },
  },
  userRoles: {
    'user_1702832400000': {
      id: 'user_1702832400000',
      user_id: 'user_1702832400000',
      role: 'organizer'
    },
    'user_1702832500000': {
      id: 'user_1702832500000',
      user_id: 'user_1702832500000',
      role: 'participant'
    },
  },
  hackathons: {
    'hackathon_1702832600000': {
      id: 'hackathon_1702832600000',
      title: 'TechInnovate 2025',
      description: 'Build innovative solutions using cutting-edge technologies',
      start_date: '2025-12-20',
      end_date: '2025-12-22',
      registration_deadline: '2025-12-19',
      location: 'Bangalore, India',
      mode: 'hybrid',
      max_participants: 500,
      prizes: ['₹50,000', '₹30,000', '₹20,000'],
      tags: ['Web3', 'AI/ML', 'IoT'],
      image_url: null,
      organizer_id: 'user_1702832400000',
      status: 'upcoming',
      createdAt: '2025-12-17T08:10:00Z'
    }
  },
  announcements: {},
  chatMessages: {},
  blogs: {},
  issues: {},
  participants: {}
};

// Initialize localStorage with sample data
export function initializeSampleData() {
  const existingData = localStorage.getItem('devnovate_app_data');
  if (!existingData) {
    console.log('✅ Initializing fresh sample data...');
    localStorage.setItem('devnovate_app_data', JSON.stringify(sampleInitializationData));
  } else {
    console.log('📦 Sample data already exists');
    // Check if users exist, if not, add them
    try {
      const data = JSON.parse(existingData);
      if (!data.users || Object.keys(data.users).length === 0) {
        console.log('🔄 No users found, reinitializing...');
        localStorage.setItem('devnovate_app_data', JSON.stringify(sampleInitializationData));
      } else {
        console.log('✅ Found', Object.keys(data.users).length, 'users in existing data');
      }
    } catch (error) {
      console.error('❌ Error parsing existing data, reinitializing...');
      localStorage.setItem('devnovate_app_data', JSON.stringify(sampleInitializationData));
    }
  }
}

// Force reset to sample data (useful when port changes or data gets corrupted)
export function resetToSampleData() {
  localStorage.setItem('devnovate_app_data', JSON.stringify(sampleInitializationData));
  console.log('🔄 Data forcefully reset to sample data');
  window.location.reload();
}

// Add some sample content to make the app more interesting
export function addSampleContent() {
  const data = JSON.parse(localStorage.getItem('devnovate_app_data') || '{}');
  
  // Add sample blogs if none exist
  if (!data.blogs || Object.keys(data.blogs).length === 0) {
    data.blogs = {
      'blog_1702832700000': {
        id: 'blog_1702832700000',
        title: 'Getting Started with React and TypeScript',
        content: 'React with TypeScript provides excellent developer experience with type safety. Here are some best practices to get you started...',
        excerpt: 'Learn the best practices for using React with TypeScript',
        author_id: 'user_1702832400000',
        tags: ['React', 'TypeScript', 'Frontend'],
        likes: 15,
        created_at: '2025-12-17T09:00:00Z'
      },
      'blog_1702832800000': {
        id: 'blog_1702832800000',
        title: 'Building Scalable APIs with Node.js',
        content: 'When building APIs that need to handle thousands of requests, proper architecture is crucial. Let me share some insights...',
        excerpt: 'Learn how to build APIs that can scale to handle high traffic',
        author_id: 'user_1702832500000',
        tags: ['Node.js', 'API', 'Backend', 'Scalability'],
        likes: 23,
        created_at: '2025-12-17T10:30:00Z'
      }
    };
  }
  
  // Add sample issues if none exist
  if (!data.issues || Object.keys(data.issues).length === 0) {
    data.issues = {
      'issue_1702832900000': {
        id: 'issue_1702832900000',
        title: 'Login page not responsive on mobile devices',
        description: 'The login form overflows on mobile screens smaller than 375px. The submit button gets cut off and users cannot complete the login process.',
        status: 'open',
        priority: 'high',
        author_id: 'user_1702832500000',
        tags: ['UI', 'Mobile', 'Bug'],
        created_at: '2025-12-17T11:00:00Z'
      },
      'issue_1702833000000': {
        id: 'issue_1702833000000',
        title: 'Add dark mode toggle to dashboard',
        description: 'Users have requested a dark mode option for better viewing experience during night time. This should be a toggle in the header or settings.',
        status: 'in-progress',
        priority: 'medium',
        author_id: 'user_1702832400000',
        tags: ['Feature', 'UI', 'Enhancement'],
        created_at: '2025-12-17T12:15:00Z'
      }
    };
  }
  
  localStorage.setItem('devnovate_app_data', JSON.stringify(data));
  console.log('✅ Sample content added');
}
