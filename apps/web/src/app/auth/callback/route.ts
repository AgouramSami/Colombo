import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Prioritise NEXT_PUBLIC_SITE_URL pour eviter les redirections vers localhost
      // si le magic link a ete genere avec une mauvaise valeur d'origine
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
  return NextResponse.redirect(`${base}/login?error=lien_invalide`);
}
