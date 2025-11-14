export default function handler(req, res) {
  console.log("SUPABASE_URL (API):", process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("SUPABASE_ANON_KEY (API):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  res.status(200).json({ ok: true })
} 