# WYA: Social Discovery Platform for Events in Kenya  

## Project Overview  
WYA is a social discovery platform connecting people to events across Kenya. It provides a user-friendly interface for discovering local events, engaging with communities, and sharing personal experiences. 

## Key Features  
- **Event Discovery:** Browse and find events based on interests and location.  
- **Real-Time Engagement System:** Users can engage in discussions and activities related to events as they happen.  
- **User-Generated Content:** Share personal experiences and create content for others to view.  
- **Community Features:** Connect with other users, foster community engagement, and participate in discussions.  
- **Throwback Content:** Revisit past events through shared user memories and photographs.  
- **Local Recommendations:** Get insights and recommendations for events happening in your community. 

## Tech Stack  
- **Frontend:** React, TypeScript, Tailwind CSS  
- **Backend:** Supabase  
- **Mobile:** Capacitor  
- **Mapping:** Mapbox  

## Getting Started  
### Node.js Requirements  
Ensure you have Node.js installed. 
- Install Node.js (v14 or later recommended)  
- Clone the repository  
```
git clone https://github.com/kiamaikocoders/wya.git  
cd wya  
```  
### Installation  
Install dependencies using npm:  
```
npm install  
```  
### Environment Setup  
Create a `.env` file in the root directory and add the necessary environment variables. No additional steps are needed.  
### Running Locally  
Start the development server:  
```
npm start  
```  

## Project Structure  
The project is organized as follows:  
- **src/**  
  - **pages/**: Contains the main application pages.  
  - **components/**: Reusable components used across the application.  
  - **services/**: API service handlers and data fetching utilities.  

## Core Features  
- **Events Discovery:** Users can find events tailored to their interests through an interactive search mechanism.  
- **Engagement System:** Keep the platform lively with throwback posts, tips from the community, and local recommendations.  
- **User Authentication:** Secure login and account management for users.  
- **Mobile-First Design:** Optimized experience on mobile devices for accessibility and usability.  

## Environment Variables  
Required variables for connectivity and API usage include:  
- **SUPABASE_URL**: Your Supabase project URL.  
- **SUPABASE_ANON_KEY**: Your Supabase public anonymous key.  
- **MAPBOX_TOKEN**: Your Mapbox access token.  
- **VERCEL_AI_KEY**: Your Vercel AI key for deployments.  

## Deployment  
Deploy the application to Vercel with Over-The-Air (OTA) updates facilitated by Capacitor.  

## Design System  
The application uses the **Inter** and **Plus Jakarta Sans** fonts, and supports both light and dark modes for a flexible user experience.  

## Development Workflow  
Follow Git best practices with feature branching, pull requests, and code reviews to ensure quality and maintainability.  

## Contributing Guidelines  
We welcome contributions! Please see our `CONTRIBUTING.md` for guidelines on how to get involved with WYA.