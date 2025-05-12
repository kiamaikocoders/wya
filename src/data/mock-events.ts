
import { Event } from "@/types/event.types";

export const mockEvents: Event[] = [
  {
    id: 1,
    title: "Nairobi International Jazz Festival",
    description: "Experience the best jazz musicians from Africa and around the world at Nairobi's premier music festival.",
    location: "Carnivore Grounds, Nairobi",
    date: "2024-05-15T18:00:00Z",
    image_url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=2070",
    category: "Music",
    organizer_id: "1", // Changed to string
    created_at: "2024-01-15T10:00:00Z",
    price: 2500,
    tags: ["jazz", "music", "festival", "live"],
    capacity: 1000
  },
  {
    id: 2,
    title: "Kenya Wildlife Photography Workshop",
    description: "Learn wildlife photography techniques from National Geographic photographers in the heart of the Maasai Mara.",
    location: "Maasai Mara",
    date: "2024-06-10T09:00:00Z",
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2069",
    category: "Education",
    organizer_id: "2", // Changed to string
    created_at: "2024-01-20T14:30:00Z",
    price: 15000,
    tags: ["photography", "wildlife", "safari", "workshop"],
    featured: true
  },
  {
    id: 3,
    title: "Lamu Cultural Festival",
    description: "Celebrate the rich Swahili culture through music, dance, crafts and traditional dhow races in historic Lamu.",
    location: "Lamu",
    date: "2024-07-20T10:00:00Z",
    image_url: "https://images.unsplash.com/photo-1515711660811-48832a4c6f69?q=80&w=1938",
    category: "Culture",
    organizer_id: "3", // Changed to string
    created_at: "2024-02-05T09:15:00Z",
    featured: true,
    tags: ["culture", "festival", "heritage", "coastal"]
  },
  {
    id: 4,
    title: "Naivasha Camping & Stargazing Weekend",
    description: "Escape the city for a weekend of camping, hiking, and stargazing at Lake Naivasha.",
    location: "Naivasha",
    date: "2024-05-25T16:00:00Z",
    image_url: "https://images.unsplash.com/photo-1546811740-23e671faf31c?q=80&w=2070",
    category: "Outdoor",
    organizer_id: "4", // Changed to string
    created_at: "2024-03-10T11:20:00Z",
    price: 3500,
    tags: ["camping", "outdoors", "stargazing", "weekend"]
  },
  {
    id: 5,
    title: "Nairobi Tech Summit",
    description: "Connect with tech innovators, startups, and investors at East Africa's largest technology conference.",
    location: "Nairobi",
    date: "2024-08-05T08:00:00Z",
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070",
    category: "Technology",
    organizer_id: "5", // Changed to string
    created_at: "2024-03-18T13:00:00Z",
    price: 5000,
    featured: true,
    tags: ["tech", "summit", "startup", "innovation"]
  },
  {
    id: 6,
    title: "Samburu Cultural Food Festival",
    description: "Experience the diverse flavors of Kenyan cuisine with a focus on traditional Samburu recipes and techniques.",
    location: "Samburu",
    date: "2024-06-15T11:00:00Z",
    image_url: "https://images.unsplash.com/photo-1499715217757-2aa48ed7e593?q=80&w=2070",
    category: "Food & Drink",
    organizer_id: "6", // Changed to string
    created_at: "2024-03-22T09:45:00Z",
    price: 1500,
    tags: ["food", "culinary", "traditional", "culture"]
  },
  {
    id: 7,
    title: "Mombasa Beach Yoga Retreat",
    description: "Rejuvenate your body and mind with a weekend yoga retreat on the beautiful beaches of Mombasa.",
    location: "Mombasa",
    date: "2024-07-05T07:00:00Z",
    image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2022",
    category: "Wellness",
    organizer_id: "7", // Changed to string
    created_at: "2024-04-01T10:30:00Z",
    price: 8000,
    tags: ["yoga", "wellness", "retreat", "beach"]
  },
  {
    id: 8,
    title: "Nakuru Business Networking Event",
    description: "Build valuable connections with business leaders and entrepreneurs from around the Rift Valley region.",
    location: "Nakuru",
    date: "2024-05-30T17:30:00Z",
    image_url: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070",
    category: "Business",
    organizer_id: "8", // Changed to string
    created_at: "2024-04-15T14:20:00Z",
    price: 1000,
    tags: ["business", "networking", "entrepreneurship"]
  }
];
