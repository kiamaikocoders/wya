
# WYA App Supabase Migration Plan

## Migration Status

### ✓ Completed:
- **Authentication**: Migrated from Xano to Supabase
- **User Profiles**: Updated to use Supabase profiles table
- **Forum Service**: Updated to use Supabase database
- **Event Service**: Using Supabase database

### Pending Tasks:
- **Survey Service**: Needs migration to Supabase 
- **Story Service**: Needs migration to Supabase
- **Monetization Service**: Needs migration to Supabase

## Required Database Tables

1. **Surveys Table**:
```sql
CREATE TABLE public.surveys (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'active'
);

CREATE TABLE public.survey_questions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'multiple_choice', 'rating', 'yes_no', 'checkbox')),
  options JSONB,
  required BOOLEAN DEFAULT false,
  order_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.survey_responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES public.surveys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

2. **Stories Table**:
```sql
CREATE TABLE public.stories (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  media_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
  status TEXT DEFAULT 'active'
);

CREATE TABLE public.story_comments (
  id SERIAL PRIMARY KEY,
  story_id INTEGER REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.story_likes (
  id SERIAL PRIMARY KEY,
  story_id INTEGER REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(story_id, user_id)
);
```

3. **Payments/Monetization Table**:
```sql
CREATE TABLE public.payments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_id INTEGER REFERENCES public.events(id),
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT NOT NULL,
  payment_method TEXT,
  reference_code TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## RLS Policies

For each table, implement Row Level Security policies like:

```sql
-- Example for stories table
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Public can view active stories
CREATE POLICY "Public can view active stories" 
  ON public.stories 
  FOR SELECT 
  USING (status = 'active');

-- Users can create their own stories
CREATE POLICY "Users can create their own stories" 
  ON public.stories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories
CREATE POLICY "Users can update their own stories" 
  ON public.stories 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories" 
  ON public.stories 
  FOR DELETE 
  USING (auth.uid() = user_id);
```

## Tasks Breakdown:

1. **Survey Service Migration**:
   - Create `survey-service.ts` using Supabase client
   - Update all components that use survey APIs
   - Implement proper RLS policies

2. **Story Service Migration**:
   - Update `story-service.ts` to use Supabase client
   - Update all components that use story APIs
   - Implement proper RLS policies

3. **Monetization Service Migration**:
   - Create `payment-service.ts` using Supabase client
   - Update ticket service and payment components
   - Implement M-Pesa integration using Edge Functions

## Edge Functions:

For services like payment processing with M-Pesa, implement Supabase Edge Functions:

```typescript
// Example Edge Function for M-Pesa
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount, eventId, userId } = await req.json();
    
    // Initialize M-Pesa API
    // Process payment
    // Store transaction in Supabase
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        event_id: eventId,
        amount: amount,
        status: 'pending',
        payment_method: 'mpesa',
        reference_code: /* Generate reference code */
      })
      .select()
      .single();
      
    // Return response
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
```

## Type Cleanup

Ensure all component types are harmonized with the database schema:

- Update `Story` type
- Update `Survey` and `SurveyQuestion` types
- Update `Payment` types
- Ensure all components use consistent types

## Testing Plan

After completing all migrations:

1. Test authentication flow (signup, login, logout)
2. Test forum functionality (create, like, comment)
3. Test event management workflows
4. Test survey creation and response collection
5. Test story creation and viewing
6. Test payment processing if applicable

Once all tests pass, you can safely delete the Xano account.
