"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase/client';

export default function BookPage() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState<'drop-off' | 'wardrobe-sorting'>('drop-off');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Please log in to book an appointment');
      setIsLoading(false);
      return;
    }

    try {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type: serviceType,
          date: dateTime,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md mx-auto text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-500 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Booking Confirmed!</h2>
            <p className="text-green-600">Redirecting to your dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Book Appointment
              </h1>
              <p className="text-gray-600">
                Select your preferred service and available time slot.
              </p>
            </div>

            {/* Calendly Embed (Primary) */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Schedule with Calendly
              </h2>
              <p className="text-gray-600 mb-4">
                Use our Calendly integration to easily find and book available time slots.
              </p>
              <div className="aspect-video bg-white rounded-lg overflow-hidden">
                <iframe
                  src={process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/seconde-dressing'}
                  className="w-full h-full border-0"
                  title="Seconde Dressing Appointment Scheduling"
                ></iframe>
              </div>
            </div>

            {/* OR Divider */}
            <div className="flex items-center mb-8">
              <div className="flex-grow h-px bg-gray-300"></div>
              <span className="mx-4 text-gray-500">OR</span>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            {/* Manual Booking Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {/* Service Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="serviceType"
                      value="drop-off"
                      checked={serviceType === 'drop-off'}
                      onChange={() => setServiceType('drop-off')}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Drop-off Service</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="serviceType"
                      value="wardrobe-sorting"
                      checked={serviceType === 'wardrobe-sorting'}
                      onChange={() => setServiceType('wardrobe-sorting')}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Wardrobe Sorting</span>
                  </label>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={minDate}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or information we should know..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors resize-none"
                ></textarea>
              </div>

              {/* Service Info */}
              <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-700">
                  {serviceType === 'drop-off' 
                    ? 'Drop-off Service: From 29 EUR/bag. We provide bags for your clothes.'
                    : 'Wardrobe Sorting: 49 EUR/hour. In-home personalized session.'}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !user}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                  isLoading || !user
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Booking...
                  </span>
                ) : !user ? (
                  'Please Log In to Book'
                ) : (
                  'Create Booking'
                )}
              </button>

              {!user && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  <Link href="/login" className="text-primary-600 hover:underline">
                    Log in here
                  </Link>
                </p>
              )}
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
