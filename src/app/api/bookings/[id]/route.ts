import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { UpdateBooking } from '@/types/database';

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, notes }: UpdateBooking = await request.json();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the booking belongs to the user
  const { data: existingBooking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingBooking || existingBooking.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 });
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status, notes })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the booking belongs to the user
  const { data: existingBooking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingBooking || existingBooking.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 });
  }

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
