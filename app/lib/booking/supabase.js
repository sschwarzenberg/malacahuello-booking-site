import { createClient } from '@supabase/supabase-js'

let _client = null

function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error(
      'Missing env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment.'
    )
    _client = createClient(url, key)
  }
  return _client
}


function experienceImageUrl(imagePath) {
  if (!imagePath) return null
  const { data } = getSupabase().storage
    .from('experience-images')
    .getPublicUrl(imagePath, {
      transform: { width: 800, height: 600, resize: 'cover', format: 'webp', quality: 80 },
    })
  return data.publicUrl
}

export async function fetchExperiences() {
  const { data, error } = await getSupabase()
    .from('experiences')
    .select('*')
    .eq('available', true)
    .order('id')

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    type: row.type,
    difficulty: row.difficulty,
    price: row.price,
    minPax: row.min_pax,
    maxPax: row.max_pax,
    available: row.available,
    name: { es: row.name_es, en: row.name_en },
    desc: { es: row.desc_es, en: row.desc_en },
    includes: { es: row.includes_es, en: row.includes_en },
    image: experienceImageUrl(row.image_path),
  }))
}

export async function saveBooking({ ref, form, payMethod, cartItems }) {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref,
      form,
      payMethod,
      cartItems: cartItems.map((c) => ({
        expId: c.exp.id,
        date: c.date,
        slot: c.slot ?? (c.exp.type === 'full' ? 'FULL' : 'AM'),
        pax: c.pax,
      })),
    }),
  })

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}))
    throw new Error(error ?? 'Booking failed')
  }

  return response.json()
}
