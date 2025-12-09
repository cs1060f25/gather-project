# Supabase Documentation

Supabase is an open-source Firebase alternative that provides a complete backend-as-a-service platform built on PostgreSQL. It combines database, authentication, storage, real-time subscriptions, and edge functions into a unified ecosystem accessible through REST APIs, GraphQL, and client SDKs. Every Supabase project includes a full Postgres database with automatic API generation, Row Level Security (RLS), and real-time capabilities powered by database triggers and WebSocket connections.

The platform is designed for rapid application development with developer-friendly tools including auto-generated documentation, SQL editor, table editor, local development CLI, and comprehensive client libraries for JavaScript, Flutter, Swift, Python, C#, and Kotlin. Supabase can be used for building everything from simple web apps to complex SaaS applications with features like social authentication, file storage with CDN delivery, serverless edge functions, AI/ML integrations with vector embeddings, and scheduled jobs via pg_cron.

## JavaScript Client - Initialize Supabase Client

Create a Supabase client instance to interact with all Supabase services including database, auth, storage, and realtime features. The client automatically handles authentication headers and provides a unified interface for all API calls.

```javascript
import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client with your project credentials
const supabaseUrl = 'https://apbkobhfnmcqqzqeeqss.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
const supabase = createClient(supabaseUrl, supabaseKey)

// With custom options
const supabaseWithOptions = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-custom-header': 'my-app' }
  }
})

// Client is now ready for queries
const { data, error } = await supabase
  .from('instruments')
  .select('*')
```

## JavaScript Client - Query Data

Execute database queries using the auto-generated REST API with chainable query builder methods. Supports filtering, ordering, pagination, and nested relationships.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Simple select query
const { data: instruments, error } = await supabase
  .from('instruments')
  .select('*')

if (error) {
  console.error('Error fetching instruments:', error)
  throw error
}
console.log('Instruments:', instruments)

// Query with filters, ordering, and pagination
const { data: violins, error: violinError } = await supabase
  .from('instruments')
  .select('id, name, created_at')
  .eq('type', 'string')
  .ilike('name', '%violin%')
  .order('created_at', { ascending: false })
  .range(0, 9)  // First 10 results

// Query with nested relationships
const { data: orders, error: orderError } = await supabase
  .from('orders')
  .select(`
    id,
    total,
    customer:customers (
      name,
      email
    ),
    items:order_items (
      quantity,
      product:products (
        name,
        price
      )
    )
  `)
  .gte('total', 100)

// Single row query
const { data: instrument, error: singleError } = await supabase
  .from('instruments')
  .select('*')
  .eq('id', 1)
  .single()  // Expects exactly one result
```

## JavaScript Client - Insert Data

Insert new rows into your database tables with automatic validation and RLS policy enforcement.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Insert single row
const { data: newInstrument, error } = await supabase
  .from('instruments')
  .insert({ name: 'trumpet', type: 'brass', price: 799.99 })
  .select()
  .single()

if (error) {
  console.error('Insert failed:', error)
  throw error
}
console.log('Created instrument:', newInstrument)

// Insert multiple rows
const instruments = [
  { name: 'flute', type: 'woodwind', price: 599.99 },
  { name: 'saxophone', type: 'woodwind', price: 1299.99 },
  { name: 'trombone', type: 'brass', price: 899.99 }
]

const { data: createdInstruments, error: bulkError } = await supabase
  .from('instruments')
  .insert(instruments)
  .select()

if (bulkError) {
  console.error('Bulk insert failed:', bulkError)
  throw bulkError
}
console.log(`Created ${createdInstruments.length} instruments`)

// Upsert (insert or update if exists)
const { data: upserted, error: upsertError } = await supabase
  .from('instruments')
  .upsert({ id: 1, name: 'violin', type: 'string', price: 1499.99 })
  .select()
```

## JavaScript Client - Update Data

Update existing rows with filters and RLS policy enforcement.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Update by ID
const { data: updated, error } = await supabase
  .from('instruments')
  .update({ price: 899.99, updated_at: new Date().toISOString() })
  .eq('id', 1)
  .select()

if (error) {
  console.error('Update failed:', error)
  throw error
}
console.log('Updated instrument:', updated)

// Update multiple rows with filter
const { data: discounted, error: discountError } = await supabase
  .from('instruments')
  .update({ price: supabase.sql`price * 0.9` })  // 10% discount
  .eq('type', 'brass')
  .select()

console.log(`Applied discount to ${discounted.length} brass instruments`)

// Conditional update
const { data: result, error: condError } = await supabase
  .from('instruments')
  .update({ in_stock: false })
  .eq('quantity', 0)
  .select()
```

## JavaScript Client - Delete Data

Remove rows from database tables with filter conditions and RLS enforcement.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Delete by ID
const { error } = await supabase
  .from('instruments')
  .delete()
  .eq('id', 1)

if (error) {
  console.error('Delete failed:', error)
  throw error
}
console.log('Instrument deleted successfully')

// Delete with multiple conditions
const { data: deleted, error: deleteError } = await supabase
  .from('instruments')
  .delete()
  .eq('in_stock', false)
  .lt('price', 100)
  .select()  // Return deleted rows

console.log(`Deleted ${deleted.length} out-of-stock budget instruments`)

// Delete all matching rows
const { error: purgeError } = await supabase
  .from('logs')
  .delete()
  .lt('created_at', new Date('2024-01-01').toISOString())

if (!purgeError) {
  console.log('Old logs purged successfully')
}
```

## Authentication - Sign Up with Email

Create new user accounts with email/password and optional metadata.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Basic email signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123!',
})

if (error) {
  console.error('Signup failed:', error.message)
  throw error
}

console.log('User created:', data.user.id)
console.log('Session:', data.session?.access_token)

// Signup with user metadata
const { data: userData, error: signupError } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123!',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      age: 30,
      subscription_plan: 'pro'
    },
    emailRedirectTo: 'https://example.com/welcome'
  }
})

if (signupError) {
  if (signupError.message.includes('already registered')) {
    console.error('Email already in use')
  }
  throw signupError
}

// Metadata is accessible via user.user_metadata
console.log('User metadata:', userData.user.user_metadata)
```

## Authentication - Sign In with Email

Authenticate existing users and establish sessions.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Email/password sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123!',
})

if (error) {
  console.error('Sign in failed:', error.message)
  throw error
}

console.log('User:', data.user.email)
console.log('Access token:', data.session.access_token)
console.log('Refresh token:', data.session.refresh_token)

// Access token is automatically included in subsequent requests
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', data.user.id)
  .single()

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user.email)
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed')
  }
})
```

## Authentication - OAuth Sign In

Authenticate users with third-party OAuth providers like Google, GitHub, and more.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Sign in with Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://example.com/auth/callback',
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
})

if (error) {
  console.error('OAuth sign in failed:', error)
  throw error
}

console.log('Redirect URL:', data.url)
// User should be redirected to data.url to complete OAuth flow

// Sign in with GitHub
const { data: githubData, error: githubError } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: 'https://example.com/auth/callback'
  }
})

// Handle callback after OAuth redirect
// The user is automatically signed in when they return to redirectTo URL
const { data: { session }, error: sessionError } = await supabase.auth.getSession()

if (session) {
  console.log('User authenticated:', session.user.email)
  console.log('OAuth provider:', session.user.app_metadata.provider)
  console.log('Provider user data:', session.user.user_metadata)
}

// Sign out
await supabase.auth.signOut()
```

## Authentication - Get Current User Session

Retrieve the current user's session and authentication state.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Get current session
const { data: { session }, error } = await supabase.auth.getSession()

if (error) {
  console.error('Failed to get session:', error)
  throw error
}

if (session) {
  console.log('User is authenticated')
  console.log('User ID:', session.user.id)
  console.log('Email:', session.user.email)
  console.log('Access token:', session.access_token)
  console.log('Expires at:', new Date(session.expires_at * 1000))
} else {
  console.log('No active session')
}

// Get current user (includes fetching fresh user data)
const { data: { user }, error: userError } = await supabase.auth.getUser()

if (user) {
  console.log('User metadata:', user.user_metadata)
  console.log('App metadata:', user.app_metadata)
  console.log('Created at:', user.created_at)
  console.log('Last sign in:', user.last_sign_in_at)
}

// Refresh session if needed
const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
if (refreshed.session) {
  console.log('Session refreshed, new token:', refreshed.session.access_token)
}
```

## Authentication - Update User Metadata

Update user profile information and custom metadata fields.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Update user metadata
const { data, error } = await supabase.auth.updateUser({
  data: {
    first_name: 'Jane',
    last_name: 'Smith',
    age: 32,
    preferences: {
      theme: 'dark',
      notifications: true
    }
  }
})

if (error) {
  console.error('Update failed:', error)
  throw error
}

console.log('Updated user:', data.user.email)
console.log('New metadata:', data.user.user_metadata)

// Update email
const { data: emailData, error: emailError } = await supabase.auth.updateUser({
  email: 'newemail@example.com'
})

if (!emailError) {
  console.log('Confirmation email sent to new address')
}

// Update password
const { data: passwordData, error: passwordError } = await supabase.auth.updateUser({
  password: 'newSecurePassword456!'
})

if (!passwordError) {
  console.log('Password updated successfully')
}
```

## Storage - Upload File

Upload files to Supabase Storage buckets with automatic content type detection and access control.

```javascript
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Upload file from buffer
const fileBuffer = await readFile('./image.jpg')
const { data, error } = await supabase
  .storage
  .from('images')
  .upload('public/avatar.jpg', fileBuffer, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
    upsert: false
  })

if (error) {
  console.error('Upload failed:', error)
  throw error
}

console.log('File uploaded:', data.path)

// Upload from browser File object
const fileInput = document.querySelector('#file-input')
const file = fileInput.files[0]

const { data: uploadData, error: uploadError } = await supabase
  .storage
  .from('documents')
  .upload(`user-uploads/${Date.now()}-${file.name}`, file, {
    cacheControl: '3600',
    upsert: false
  })

// Get public URL
const { data: publicUrlData } = supabase
  .storage
  .from('images')
  .getPublicUrl('public/avatar.jpg')

console.log('Public URL:', publicUrlData.publicUrl)

// Upload with RLS policies (requires authenticated user)
const { data: userData, error: authError } = await supabase.auth.getUser()
const userId = userData.user?.id

const { data: privateUpload, error: privateError } = await supabase
  .storage
  .from('private-files')
  .upload(`${userId}/document.pdf`, fileBuffer)
```

## Storage - Download File

Download files from storage buckets with signed URLs for private access.

```javascript
import { createClient } from '@supabase/supabase-js'
import { writeFile } from 'fs/promises'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Download file as Blob
const { data, error } = await supabase
  .storage
  .from('images')
  .download('public/avatar.jpg')

if (error) {
  console.error('Download failed:', error)
  throw error
}

console.log('File downloaded, size:', data.size)

// Save to disk
const buffer = Buffer.from(await data.arrayBuffer())
await writeFile('./downloaded-avatar.jpg', buffer)

// Create signed URL for private files (expires in 1 hour)
const { data: signedUrlData, error: urlError } = await supabase
  .storage
  .from('private-files')
  .createSignedUrl('user-123/document.pdf', 3600)

if (urlError) {
  console.error('Failed to create signed URL:', urlError)
  throw urlError
}

console.log('Signed URL (valid for 1 hour):', signedUrlData.signedUrl)

// Get public URL (for public buckets only)
const { data: publicUrlData } = supabase
  .storage
  .from('images')
  .getPublicUrl('public/avatar.jpg')

console.log('Public URL:', publicUrlData.publicUrl)

// Download with transform (resize image)
const { data: transformedData, error: transformError } = await supabase
  .storage
  .from('images')
  .download('public/avatar.jpg', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover',
      quality: 80
    }
  })
```

## Storage - List Files in Bucket

List and search files within storage buckets with filtering and pagination.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// List all files in a bucket folder
const { data: files, error } = await supabase
  .storage
  .from('images')
  .list('public', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  })

if (error) {
  console.error('List failed:', error)
  throw error
}

console.log(`Found ${files.length} files:`)
files.forEach(file => {
  console.log(`- ${file.name} (${file.metadata.size} bytes, ${file.metadata.mimetype})`)
  console.log(`  Created: ${file.created_at}, Updated: ${file.updated_at}`)
})

// Search for specific files
const { data: jpgFiles, error: searchError } = await supabase
  .storage
  .from('images')
  .list('public', {
    search: '.jpg'
  })

console.log(`Found ${jpgFiles.length} JPG files`)

// List with pagination
async function listAllFiles(bucket, folder) {
  let allFiles = []
  let offset = 0
  const limit = 100

  while (true) {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .list(folder, { limit, offset })

    if (error) throw error
    if (data.length === 0) break

    allFiles = allFiles.concat(data)
    offset += limit
  }

  return allFiles
}

const allImages = await listAllFiles('images', 'public')
console.log(`Total files: ${allImages.length}`)
```

## Storage - Delete Files

Remove files from storage buckets.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Delete single file
const { data, error } = await supabase
  .storage
  .from('images')
  .remove(['public/avatar.jpg'])

if (error) {
  console.error('Delete failed:', error)
  throw error
}

console.log('File deleted successfully')

// Delete multiple files
const filesToDelete = [
  'public/image1.jpg',
  'public/image2.jpg',
  'public/image3.jpg'
]

const { data: multiData, error: multiError } = await supabase
  .storage
  .from('images')
  .remove(filesToDelete)

if (multiError) {
  console.error('Batch delete failed:', multiError)
  throw multiError
}

console.log(`Deleted ${filesToDelete.length} files`)

// Delete all files in a folder (list then delete)
const { data: files, error: listError } = await supabase
  .storage
  .from('images')
  .list('temp-folder')

if (!listError && files.length > 0) {
  const pathsToDelete = files.map(file => `temp-folder/${file.name}`)

  const { error: deleteError } = await supabase
    .storage
    .from('images')
    .remove(pathsToDelete)

  if (!deleteError) {
    console.log(`Deleted ${files.length} files from temp-folder`)
  }
}
```

## Realtime - Subscribe to Database Changes

Listen to real-time changes in your database tables using Postgres replication.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Subscribe to all changes on a table
const channel = supabase
  .channel('instruments-channel')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'instruments' },
    (payload) => {
      console.log('Change received!', payload)
      console.log('Event type:', payload.eventType) // INSERT, UPDATE, or DELETE
      console.log('New record:', payload.new)
      console.log('Old record:', payload.old)
    }
  )
  .subscribe()

// Subscribe to INSERT events only
const insertChannel = supabase
  .channel('instruments-inserts')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'instruments' },
    (payload) => {
      console.log('New instrument added:', payload.new.name)
    }
  )
  .subscribe()

// Subscribe to UPDATE events with filter
const updateChannel = supabase
  .channel('expensive-instruments')
  .on('postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'instruments',
      filter: 'price=gt.1000'
    },
    (payload) => {
      console.log('Expensive instrument updated:', payload.new)
    }
  )
  .subscribe()

// Subscribe to DELETE events
const deleteChannel = supabase
  .channel('instruments-deletes')
  .on('postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'instruments' },
    (payload) => {
      console.log('Instrument deleted:', payload.old)
    }
  )
  .subscribe()

// Unsubscribe when done
setTimeout(() => {
  channel.unsubscribe()
  console.log('Unsubscribed from changes')
}, 60000)
```

## Realtime - Presence Tracking

Track which users are currently online in a channel with shared state.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Get current user
const { data: { user } } = await supabase.auth.getUser()

const channel = supabase.channel('room-1')

// Track presence
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Current users online:', Object.keys(state).length)

    Object.values(state).forEach(users => {
      users.forEach(user => {
        console.log(`- ${user.username} (last seen: ${user.last_seen})`)
      })
    })
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      // Send presence state
      await channel.track({
        user_id: user.id,
        username: user.email,
        online_at: new Date().toISOString(),
        status: 'active'
      })
    }
  })

// Update presence state
setInterval(async () => {
  await channel.track({
    user_id: user.id,
    username: user.email,
    last_seen: new Date().toISOString(),
    status: 'active'
  })
}, 30000) // Update every 30 seconds

// Untrack presence on leave
window.addEventListener('beforeunload', async () => {
  await channel.untrack()
})
```

## Edge Functions - Create and Deploy

Create serverless TypeScript functions that run globally at the edge.

```bash
# Initialize a new function
supabase functions new hello-world

# This creates: supabase/functions/hello-world/index.ts
```

```typescript
// supabase/functions/hello-world/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Get request method and parse body
    const { method } = req
    const body = method === 'POST' ? await req.json() : null

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get authenticated user from request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Perform database operations
    const { data: instruments, error } = await supabase
      .from('instruments')
      .select('*')
      .limit(10)

    if (error) throw error

    // Return response
    return new Response(
      JSON.stringify({
        message: 'Hello from Edge Function!',
        user: user.email,
        instruments: instruments,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

```bash
# Deploy the function
supabase functions deploy hello-world

# Invoke the function
curl -L -X POST 'https://apbkobhfnmcqqzqeeqss.supabase.co/functions/v1/hello-world' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"name":"test"}'
```

## Database - Direct SQL Query via RPC

Execute custom PostgreSQL functions exposed as RPC endpoints.

```sql
-- First create a function in SQL Editor
CREATE OR REPLACE FUNCTION get_instruments_by_type(instrument_type TEXT)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  type TEXT,
  price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.name, i.type, i.price
  FROM instruments i
  WHERE i.type = instrument_type
  ORDER BY i.price DESC;
END;
$$ LANGUAGE plpgsql;
```

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Call the RPC function
const { data, error } = await supabase
  .rpc('get_instruments_by_type', { instrument_type: 'string' })

if (error) {
  console.error('RPC failed:', error)
  throw error
}

console.log('String instruments:', data)

// RPC with multiple parameters
const { data: result, error: calcError } = await supabase
  .rpc('calculate_order_total', {
    order_id: 123,
    discount_code: 'SAVE10'
  })

console.log('Order total:', result)

// RPC that modifies data
const { data: updated, error: updateError } = await supabase
  .rpc('update_inventory', {
    product_id: 456,
    quantity_change: -5
  })

if (!updateError) {
  console.log('Inventory updated:', updated)
}
```

## Management API - Create Project

Programmatically create and manage Supabase projects via the Management API.

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="sbp_abc123..."

# List organizations
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  https://api.supabase.com/v1/organizations

# Create a new project
curl -X POST https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "your-org-id",
    "name": "My New Project",
    "region": "us-east-1",
    "db_pass": "YourSecurePassword123!",
    "plan": "free"
  }'
```

```javascript
// Using JavaScript
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

// Create project
const response = await fetch('https://api.supabase.com/v1/projects', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    organization_id: 'your-org-id',
    name: 'My New Project',
    region: 'us-east-1',
    db_pass: 'YourSecurePassword123!',
    plan: 'free'
  })
})

const project = await response.json()
console.log('Project created:', project.id)
console.log('Project ref:', project.ref)
console.log('Database URL:', project.database.host)

// List all projects
const listResponse = await fetch('https://api.supabase.com/v1/projects', {
  headers: { 'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}` }
})
const projects = await listResponse.json()
console.log(`You have ${projects.length} projects`)

// Get project details
const detailsResponse = await fetch(`https://api.supabase.com/v1/projects/${project.ref}`, {
  headers: { 'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}` }
})
const details = await detailsResponse.json()
console.log('Project status:', details.status)
```

## CLI - Local Development Setup

Set up and run Supabase locally for development with Docker.

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local project
cd your-project
supabase init

# Start local Supabase instance (requires Docker)
supabase start

# Output shows:
# API URL: http://localhost:54321
# GraphQL URL: http://localhost:54321/graphql/v1
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Create a migration
supabase migration new create_instruments_table

# Edit the migration file in supabase/migrations/
# Then apply it
supabase db reset

# Generate TypeScript types from database schema
supabase gen types typescript --local > types/supabase.ts

# Run Edge Functions locally
supabase functions serve

# Deploy to production
supabase link --project-ref your-project-ref
supabase db push
supabase functions deploy

# Stop local instance
supabase stop
```

```typescript
// Use generated types for type safety
import { Database } from './types/supabase'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

// Now queries are fully typed
const { data: instruments } = await supabase
  .from('instruments')  // Type-checked table name
  .select('id, name, type, price')  // Type-checked columns
  .eq('type', 'string')  // Type-checked values

// TypeScript knows the structure of instruments
instruments?.forEach(instrument => {
  console.log(instrument.name)  // TypeScript knows this exists
})
```

## Row Level Security - Policies

Implement database-level authorization with Row Level Security policies.

```sql
-- Enable RLS on a table
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all instruments
CREATE POLICY "Anyone can read instruments"
ON instruments
FOR SELECT
TO public
USING (true);

-- Policy: Users can only insert their own data
CREATE POLICY "Users can insert own instruments"
ON instruments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own instruments
CREATE POLICY "Users can update own instruments"
ON instruments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own instruments
CREATE POLICY "Users can delete own instruments"
ON instruments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admin role can do everything
CREATE POLICY "Admins can do everything"
ON instruments
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role') = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role') = 'admin'
);

-- Complex policy: Users can see public instruments or their own
CREATE POLICY "Users see public or own instruments"
ON instruments
FOR SELECT
TO authenticated
USING (
  is_public = true
  OR user_id = auth.uid()
  OR (auth.jwt() ->> 'role') = 'admin'
);
```

```javascript
import { createClient } from '@supabase/supabase-js'

// With RLS enabled, queries respect policies automatically
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// User signs in
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// This query only returns instruments the user has access to
const { data: instruments, error } = await supabase
  .from('instruments')
  .select('*')

// This insert automatically sets user_id from JWT
const { data: newInstrument, error: insertError } = await supabase
  .from('instruments')
  .insert({ name: 'Guitar', type: 'string', price: 599 })

// User can only update/delete their own records
const { error: updateError } = await supabase
  .from('instruments')
  .update({ price: 549 })
  .eq('id', 123)  // Fails if user doesn't own this record
```

## Summary

Supabase provides a comprehensive backend platform that eliminates the need for custom API development by automatically generating REST and GraphQL APIs from your PostgreSQL database schema. The platform's core strength lies in its tight integration between database operations, authentication, and authorization through Row Level Security policies, allowing developers to define access control rules at the database level that are automatically enforced across all API calls. With built-in support for real-time subscriptions via WebSockets, developers can build collaborative and reactive applications without managing WebSocket infrastructure.

Primary use cases include building SaaS applications with user authentication and role-based access control, creating real-time collaborative tools with presence tracking and live data synchronization, developing mobile and web applications with file upload/download capabilities through Storage, and implementing serverless workflows with Edge Functions for webhooks, scheduled jobs, and third-party integrations. The platform supports both cloud-hosted and self-hosted deployments, offers comprehensive client libraries for all major frameworks and languages, and provides local development tools through the CLI for database migrations, type generation, and testing before production deployment. The Management API enables programmatic project creation and configuration, making Supabase suitable for agencies and platforms that need to provision isolated databases for multiple clients or tenants.
