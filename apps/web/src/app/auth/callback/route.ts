import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
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
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const otpType = searchParams.get('type');
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token') ?? '';
  const next = searchParams.get('next') ?? '/dashboard';
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? origin;

  // ── Flux PKCE : échange le code contre une session ──────────────────────
  if (code) {
    const cookieStore = await cookies();
    const supabase = makeSupabase(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  // ── Flux OTP hash (magic link) : verifyOtp(token_hash, type) ─────────────
  if (tokenHash && otpType) {
    const cookieStore = await cookies();
    const supabase = makeSupabase(cookieStore);
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email',
    });
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  // ── Flux implicite (étape 2) : access_token reçu en query param ─────────
  // La page bridge ci-dessous déplace le token du hash vers ici.
  if (accessToken) {
    const cookieStore = await cookies();
    const supabase = makeSupabase(cookieStore);
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  // ── Flux implicite (étape 1) : pas de code → servir la page bridge ───────
  // Le navigateur atterrit ici avec #access_token=... dans le hash.
  // La page bridge lit le hash et redirige vers ce même endpoint avec
  // access_token en query param (visible côté serveur).
  const nextEncoded = encodeURIComponent(next);
  const bridgePage = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Connexion en cours…</title></head>
<body>
<script>
(function () {
  var h = location.hash.slice(1);
  var p = new URLSearchParams(h);
  var at = p.get('access_token');
  var rt = p.get('refresh_token');
  if (at) {
    var url = '/auth/callback?next=${nextEncoded}&access_token=' + encodeURIComponent(at);
    if (rt) url += '&refresh_token=' + encodeURIComponent(rt);
    location.replace(url);
  } else {
    location.replace('/login?error=lien_invalide');
  }
}());
</script>
</body>
</html>`;

  return new NextResponse(bridgePage, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
