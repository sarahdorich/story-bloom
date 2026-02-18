import { createBrowserClient } from '@supabase/ssr'

const COOKIE_NAME = 'storybloom-auth'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: COOKIE_NAME,
      },
    }
  )
}
