// Default organizer configuration
// Since only one organizer is needed, we can set default credentials here

export const DEFAULT_ORGANIZER = {
  email: 'organizer@devnovate.com',
  password: 'organizer123', // Only used for initial setup
  name: 'Devnovate Organizer',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=devnovate',
};

// Helper to check if a user is the default organizer
export const isDefaultOrganizer = (email: string) => {
  return email === DEFAULT_ORGANIZER.email;
};
