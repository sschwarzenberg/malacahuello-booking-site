import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VALID_SLOTS = new Set(['AM', 'PM', 'FULL'])
const VALID_PAY_METHODS = new Set(['mp', 'fintoc'])

function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ref, form, payMethod, cartItems } = body as Record<string, unknown> & {
    form?: Record<string, unknown>
    cartItems?: unknown[]
  }

  if (
    typeof ref !== 'string' || !/^MCH-[A-Z0-9]{6}$/.test(ref) ||
    typeof form?.name !== 'string' || !form.name.trim() ||
    typeof form?.email !== 'string' || !form.email.includes('@') ||
    typeof form?.phone !== 'string' || !form.phone.trim() ||
    !VALID_PAY_METHODS.has(payMethod as string) ||
    !Array.isArray(cartItems) || cartItems.length === 0 || cartItems.length > 20
  ) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  for (const item of cartItems) {
    const i = item as Record<string, unknown>
    if (
      typeof i.expId !== 'number' ||
      typeof i.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(i.date) ||
      !VALID_SLOTS.has(i.slot as string) ||
      typeof i.pax !== 'number' || !Number.isInteger(i.pax) || i.pax < 1 || i.pax > 100
    ) {
      return Response.json({ error: 'Invalid cart item' }, { status: 400 })
    }
  }

  const supabase = serverSupabase()

  // Look up real prices from DB — client cannot influence these
  const expIds = [...new Set((cartItems as Record<string, unknown>[]).map((c) => c.expId as number))]
  const { data: experiences, error: expError } = await supabase
    .from('experiences')
    .select('id, price, min_pax, max_pax, available')
    .in('id', expIds)

  if (expError || !experiences) {
    return Response.json({ error: 'Failed to load experiences' }, { status: 500 })
  }

  const expMap = new Map(experiences.map((e) => [e.id as number, e]))

  // Validate availability + pax, compute total from DB prices
  let total = 0
  const itemRows: {
    experience_id: number
    date: string
    slot: string
    pax: number
    unit_price: number
  }[] = []

  for (const rawItem of cartItems) {
    const item = rawItem as Record<string, unknown>
    const exp = expMap.get(item.expId as number)
    if (!exp) return Response.json({ error: 'Experience not found' }, { status: 400 })
    if (!exp.available) return Response.json({ error: 'Experience not available' }, { status: 400 })
    if ((item.pax as number) < exp.min_pax || (item.pax as number) > exp.max_pax) {
      return Response.json({ error: 'Invalid participant count' }, { status: 400 })
    }
    total += exp.price * (item.pax as number)
    itemRows.push({
      experience_id: item.expId as number,
      date: item.date as string,
      slot: item.slot as string,
      pax: item.pax as number,
      unit_price: exp.price,
    })
  }

  const bookingId = crypto.randomUUID()

  const { error: bookingError } = await supabase.from('bookings').insert({
    id: bookingId,
    ref,
    customer_name: (form.name as string).trim().slice(0, 200),
    customer_email: (form.email as string).trim().slice(0, 200),
    customer_phone: (form.phone as string).trim().slice(0, 50),
    notes: form.notes ? String(form.notes).trim().slice(0, 1000) : null,
    pay_method: payMethod,
    total_clp: total,
    status: 'pending',
  })

  if (bookingError) {
    return Response.json({ error: 'Failed to create booking' }, { status: 500 })
  }

  const { error: itemsError } = await supabase.from('booking_items').insert(
    itemRows.map((row) => ({ ...row, booking_id: bookingId }))
  )

  if (itemsError) {
    return Response.json({ error: 'Failed to create booking items' }, { status: 500 })
  }

  return Response.json({ bookingId, total }, { status: 201 })
}
