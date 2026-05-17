import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const UI_META = {
  "termas-tolhuaca":  { emoji: "♨️", color: "#8B4513", bgColor: "#FDF0E8" },
  "lonquimay":        { emoji: "🌋", color: "#C0392B", bgColor: "#FDECEC" },
  "bosque-araucarias":{ emoji: "🌲", color: "#27AE60", bgColor: "#E8F8EF" },
  "kayak-biobio":     { emoji: "🛶", color: "#2980B9", bgColor: "#EAF4FD" },
  "cabalgata":        { emoji: "🐴", color: "#8E44AD", bgColor: "#F3EAF9" },
  "condor-birding":   { emoji: "🦅", color: "#E67E22", bgColor: "#FEF3E6" },
}

function experienceImageUrl(imagePath) {
  if (!imagePath) return null
  const { data } = supabase.storage
    .from('experience-images')
    .getPublicUrl(imagePath, {
      transform: { width: 800, height: 600, resize: 'cover', format: 'webp', quality: 80 },
    })
  return data.publicUrl
}

export async function fetchExperiences() {
  const { data, error } = await supabase
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
    ...(UI_META[row.slug] ?? { emoji: "🏔️", color: "#555", bgColor: "#f5f5f5" }),
  }))
}

export async function saveBooking({ ref, form, payMethod, total, cartItems }) {
  const bookingId = crypto.randomUUID()

  const { error: bookingError } = await supabase
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

  const { error: itemsError } = await supabase.from('booking_items').insert(
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
