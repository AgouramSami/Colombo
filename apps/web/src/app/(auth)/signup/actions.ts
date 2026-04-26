'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const SignUpSchema = z
  .object({
    display_name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
  });

export async function signUpAction(formData: FormData) {
  const parsed = SignUpSchema.safeParse({
    display_name: formData.get('display_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path.includes('confirm_password')) {
      redirect('/signup?error=mots_de_passe_differents');
    }
    redirect('/signup?error=formulaire_invalide');
  }

  const { display_name, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === 'user_already_exists' || error.message?.includes('already registered')) {
      redirect('/login?error=email_existant');
    }
    redirect('/signup?error=envoi_echoue');
  }

  // Si la confirmation email est désactivée dans Supabase, une session est retournée directement
  if (data.session) {
    redirect('/pigeonnier');
  }

  redirect(`/login?sent=${encodeURIComponent(email)}`);
}
