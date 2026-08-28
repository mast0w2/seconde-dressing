import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { InsertBooking } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get: (key) => cookies().get(key)?.value,
      set: (key, value, options) => cookies().set(key, value, options),
      remove: (key, options) => cookies().delete(key, options),
    },
  }
);

export async function GET() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const { service_type, date, notes }: InsertBooking = await request.json();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert([{
      user_id: session.user.id,
      service_type,
      date,
      notes,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ booking });
}
