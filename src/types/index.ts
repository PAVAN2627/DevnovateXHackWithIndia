export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'organizer' | 'participant';
}

export interface Hackathon {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  location: string;
  mode: 'online' | 'offline' | 'hybrid';
  maxParticipants: number;
  currentParticipants: number;
  prizes: string[];
  tags: string[];
  organizerId: string;
  organizerName: string;
  image?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: User;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  image?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  author: User;
  assignee?: User;
  hackathonId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  hackathonId: string;
  title: string;
  content: string;
  author: User;
  createdAt: string;
  isPinned: boolean;
}

export interface ChatMessage {
  id: string;
  hackathonId: string;
  content: string;
  author: User;
  createdAt: string;
  type: 'text' | 'image' | 'link';
}
