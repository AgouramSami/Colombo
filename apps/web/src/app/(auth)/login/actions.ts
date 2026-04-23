'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const EmailSchema = z.string().email();

export async function loginAction(formData: FormData) {
  const raw = formData.get('email');
  const parsed = EmailSchema.safeParse(raw);

  if (!parsed.success) {
    redirect('/login?error=email_invalide');
  }

  const email = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env['NEXT_PUBLIC_SITE_URL']}/auth/callback`,
    },
  });

  if (error) {
    redirect('/login?error=envoi_echoue');
  }

  redirect(`/login?sent=${encodeURIComponent(email)}`);
}
