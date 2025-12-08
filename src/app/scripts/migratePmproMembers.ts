// src/app/scripts/migratePmproMembers.ts
//
// Run with:
//   npx ts-node src/app/scripts/migratePmproMembers.ts
//
// Env vars needed:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

type LegacyPmproMember = {
  id: number | null // WP user id (from CSV)
  username: string | null
  firstname: string | null
  lastname: string | null
  email: string | null
  membership: string | null
  discount_code_id: number | null
  discount_code: string | null
  subscription_transaction_id: string | null
  billing_amount: number | null
  cycle_number: number | null
  cycle_period: string | null
  next_payment_date: string | null
  joined: string | null
  startdate: string | null
  expires: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL')
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY')
}

// We've checked they're defined; tell TS they're strings
const supabase = createClient(
  SUPABASE_URL as string,
  SUPABASE_SERVICE_ROLE_KEY as string,
)

// Helper: find a user by email using listUsers (no getUserByEmail in this SDK)
async function findUserByEmail(email: string) {
  const target = email.toLowerCase()
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      console.error('Error listing users on page', page, error)
      throw error
    }

    const users = data?.users ?? []

    const found = users.find(
      (u) => u.email && u.email.toLowerCase() === target,
    )
    if (found) return found

    if (users.length < perPage) {
      // No more pages
      return null
    }

    page += 1
  }
}

async function migrate() {
  console.log(
    'Fetching legacy PMPro members with subscription_transaction_id or billing_amount...',
  )

  const { data: members, error } = await supabase
    .from('legacy_pmpro_members')
    .select('*')
    .or('subscription_transaction_id.not.is.null,billing_amount.not.is.null')

  if (error) {
    console.error('Error fetching legacy members:', error)
    throw error
  }

  if (!members || members.length === 0) {
    console.log('No matching legacy members found. Nothing to do.')
    return
  }

  console.log(`Found ${members.length} legacy members to process.`)

  let createdUsers = 0
  let updatedProfiles = 0

  for (const row of members as LegacyPmproMember[]) {
    const email = row.email?.trim()
    if (!email) {
      console.warn(`Skipping row with missing email (legacy id ${row.id})`)
      continue
    }

    console.log(`\nProcessing ${email} (legacy id ${row.id ?? 'null'})`)

    // 1) Ensure auth user exists
    const existingUser = await findUserByEmail(email)
    let userId = existingUser?.id

    if (!userId) {
      console.log(`No auth user found for ${email}, creating...`)
      const { data: created, error: createErr } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        })

      if (createErr) {
        console.error('Error creating auth user for', email, createErr)
        throw createErr
      }

      userId = created.user.id
      createdUsers++
      console.log(`Created auth user ${userId} for ${email}`)
    } else {
      console.log(`Found existing auth user ${userId} for ${email}`)
    }

    // 2) Map membership → user_type ('business' | 'investor' | 'member')
    let userType: 'business' | 'investor' | 'member' = 'member'
    if (row.membership) {
      const lower = row.membership.toLowerCase()
      if (lower.includes('investor')) {
        userType = 'investor'
      } else if (lower.includes('business')) {
        userType = 'business'
      }
    }

    const displayName =
      row.firstname && row.lastname
        ? `${row.firstname} ${row.lastname}`
        : row.username

    const { error: profileErr } = await supabase.from('profiles').upsert(
      {
        id: userId,
        first_name: row.firstname || null,
        last_name: row.lastname || null,
        display_name: displayName || null,
        user_type: userType, // 👈 now guaranteed to be 'business' | 'investor' | 'member'
        wordpress_user_id: row.id ?? null,
        migrated_at: new Date().toISOString(),
        migration_status: 'seeded_from_pmpro',
      },
      { onConflict: 'id' },
    )

    if (profileErr) {
      console.error('Error upserting profile for', email, profileErr)
      throw profileErr
    }

    updatedProfiles++
    console.log(
      `Upserted profile for ${email} (user_type=${userType}, wp_id=${row.id ?? 'null'})`,
    )
  }

  console.log('\nMigration complete.')
  console.log(`Auth users created: ${createdUsers}`)
  console.log(`Profiles upserted: ${updatedProfiles}`)
}

migrate()
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
