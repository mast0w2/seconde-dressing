import '@testing-library/jest-dom'

// Dummy Supabase env so getSupabaseEnv() passes in tests (the client itself is
// mocked via jest.mock('@supabase/ssr') in the test files that need it).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key'
