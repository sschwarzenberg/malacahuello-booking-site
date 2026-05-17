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

export async function saveBooking({ ref, form, payMethod, total, cartItems }) {
  const bookingId = crypto.randomUUID()

  const { error: bookingError } = await getSupabase()
    .from('bookings')
    .insert({
      id: bookingId,
      ref,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      notes: form.notes || null,
      pay_method: payMethod,
      total_clp: total,
      status: 'pending',
    })

  if (bookingError) throw bookingError

  const { error: itemsError } = await getSupabase().from('booking_items').insert(
    cartItems.map((c) => ({
      booking_id: bookingId,
      experience_id: c.exp.id,
      date: c.date,
      slot: c.slot ?? (c.exp.type === 'full' ? 'FULL' : 'AM'),
      pax: c.pax,
      unit_price: c.exp.price,
    }))
  )

  if (itemsError) throw itemsError
}
