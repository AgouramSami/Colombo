import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname === '/login' || pathname === '/signup' || pathname.startsWith('/auth');

  // Règle 1 : non connecté sur une route protégée → /login
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarded_at')
      .eq('id', user.id)
      .single();

    const isOnboarded = profile?.onboarded_at != null;

    // Règle 2 : connecté sur /login → /onboarding ou /pigeonnier
    if (pathname === '/login') {
      const destination = isOnboarded ? '/pigeonnier' : '/onboarding';
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // Règle 3 : connecté, pas onboardé, sur route protégée → /onboarding
    if (!isOnboarded && !pathname.startsWith('/onboarding') && !isAuthRoute) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Règle 4 : connecté, onboardé, accède à /onboarding → /pigeonnier
    if (isOnboarded && pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/pigeonnier', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
