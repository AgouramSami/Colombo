'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const EmailSchema = z.string().email();
const PasswordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect('/login?error=envoi_echoue');
  }

  redirect(`/login?sent=${encodeURIComponent(email)}`);
}

export async function signInWithPasswordAction(formData: FormData) {
  const parsed = PasswordLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    redirect('/login?error=identifiants_invalides');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect('/login?error=identifiants_invalides');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (profile?.is_admin) redirect('/admin/dashboard');
  }

  redirect('/dashboard');
}
