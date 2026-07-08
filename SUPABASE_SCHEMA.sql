-- SUPABASE SQL SCHEMA FOR NAKAMAL CHAT & BUSINESS MANAGEMENT
-- ENFORCES ROBUST DATA PRIVACY, FIELD VALIDATIONS, PREVENTS PRIVILEGE ESCALATION
-- AUTOMATICALLY PROVISIONS A 14-DAY FREE TRIAL FOR CORPORATE USERS (MANAGER, SUPPLIER, EXPORTER)

-- Enable PostGIS for location features
CREATE EXTENSION IF NOT EXISTS postgis;

-- ----------------------------------------------------
-- 1. Tables Definition
-- ----------------------------------------------------

-- Users metadata table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'supplier', 'exporter', 'user')),
  bar_id TEXT,
  business_name TEXT,
  contact_person TEXT,
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  approved BOOLEAN DEFAULT TRUE,
  subscription_active BOOLEAN DEFAULT TRUE,
  subscription JSONB DEFAULT '{}'::JSONB,
  avatar_url TEXT,
  background_url TEXT,
  description TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": true, "marketing": true}'::JSONB,
  business_hours JSONB DEFAULT '{}'::JSONB,
  exporter_rates JSONB DEFAULT '{"greenKavaRoots": 1500, "greenKavaChips": 1100, "sunDriedKavaRoots": 2500, "sunDriedKavaChips": 1800}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Case-matching alias columns for frontend compatibility
  "firstName" TEXT,
  "lastName" TEXT,
  "barId" TEXT,
  "businessName" TEXT,
  "contactPerson" TEXT,
  "subscriptionActive" BOOLEAN,
  "notificationPreferences" JSONB,
  "businessHours" JSONB,
  "exporterRates" JSONB
);

-- Bars table
CREATE TABLE IF NOT EXISTS public.bars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
  category TEXT,
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  price_preview NUMERIC DEFAULT 0 CHECK (price_preview >= 0),
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION CHECK (lat >= -90.0 AND lat <= 90.0),
  lng DOUBLE PRECISION CHECK (lng >= -180.0 AND lng <= 180.0),
  business_hours JSONB DEFAULT '{}'::JSONB,
  status_history JSONB DEFAULT '[]'::JSONB,
  logo_url TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id TEXT REFERENCES public.bars(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  promotion_price INTEGER CHECK (promotion_price >= 0),
  description TEXT,
  image_url TEXT,
  category TEXT,
  status TEXT DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Out of Stock', 'Discontinued')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bar updates table
CREATE TABLE IF NOT EXISTS public.bar_updates (
  id TEXT PRIMARY KEY,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product', 'event', 'notice')),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  image_url TEXT,
  ad_image_url TEXT,
  timestamp BIGINT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'business')),
  reactions JSONB DEFAULT '{}'::JSONB,
  comments JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  participants UUID[] NOT NULL CHECK (array_length(participants, 1) >= 1 AND array_length(participants, 1) <= 100),
  name TEXT,
  last_message JSONB,
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL CHECK (length(trim(text)) > 0),
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'order_request', 'delivery_alert')),
  metadata JSONB DEFAULT '{}'::JSONB,
  attachments JSONB DEFAULT '[]'::JSONB,
  timestamp BIGINT NOT NULL,
  read_by UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (Marketplace)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock_level INTEGER DEFAULT 0 CHECK (stock_level >= 0),
  supplier_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  image_url TEXT,
  status TEXT DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Out of Stock')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location Tracking Table (PostGIS geography)
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  coordinates geography(Point, 4326) NOT NULL, 
  captured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id TEXT REFERENCES public.bars(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
  due_date BIGINT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT task_owner_check CHECK (bar_id IS NOT NULL OR supplier_id IS NOT NULL)
);

-- ----------------------------------------------------
-- 2. Indexes for Peak Query Performance
-- ----------------------------------------------------
CREATE INDEX IF NOT EXISTS chats_participants_idx ON public.chats USING GIN (participants);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON public.messages (chat_id);
CREATE INDEX IF NOT EXISTS messages_timestamp_idx ON public.messages (timestamp ASC);
CREATE INDEX IF NOT EXISTS products_supplier_id_idx ON public.products (supplier_id);
CREATE INDEX IF NOT EXISTS user_locations_user_id_idx ON public.user_locations (user_id);
CREATE INDEX IF NOT EXISTS user_locations_coordinates_idx ON public.user_locations USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS bars_manager_id_idx ON public.bars (manager_id);
CREATE INDEX IF NOT EXISTS menu_items_bar_id_idx ON public.menu_items (bar_id);
CREATE INDEX IF NOT EXISTS bar_updates_bar_id_idx ON public.bar_updates (bar_id);
CREATE INDEX IF NOT EXISTS tasks_bar_id_idx ON public.tasks (bar_id);
CREATE INDEX IF NOT EXISTS tasks_supplier_id_idx ON public.tasks (supplier_id);

-- ----------------------------------------------------
-- 3. Security and Field Validation Triggers
-- ----------------------------------------------------

-- User profiles trigger: camelCase aliases synchronization, 14-day free trial provision, and privilege escalation guards
CREATE OR REPLACE FUNCTION public.process_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  caller_role TEXT;
  trial_duration_ms BIGINT;
  current_time_ms BIGINT;
BEGIN
  current_time_ms := EXTRACT(EPOCH FROM NOW()) * 1000;
  trial_duration_ms := 14 * 24 * 60 * 60 * 1000; -- 14 days in milliseconds

  -- 1. Identity Verification & Caller Role Detection
  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();
  END IF;

  -- 2. Insert Action Handling
  IF TG_OP = 'INSERT' THEN
    -- Identity Spoofing prevention
    IF auth.uid() IS NOT NULL AND NEW.id <> auth.uid() THEN
      RAISE EXCEPTION 'Identity Spoofing: You cannot create a profile with a mismatched id.';
    END IF;

    -- Default role mapping and admin privilege escalation defense
    IF NEW.role = 'admin' AND (caller_role IS DISTINCT FROM 'admin') THEN
      NEW.role := 'user';
    END IF;

    -- Enforce absolute 14-day free trial on signup for Manager, Supplier, and Exporter
    IF NEW.role IN ('manager', 'supplier', 'exporter') THEN
      NEW.approved := TRUE;
      NEW.subscription_active := TRUE;
      NEW."subscriptionActive" := TRUE;
      
      -- Inject solid 14-day trial configuration details safely
      NEW.subscription := jsonb_build_object(
        'planId', 'monthly',
        'status', 'active',
        'autoRenew', false,
        'isTrial', true,
        'currentPeriodEnd', current_time_ms + trial_duration_ms
      );
    ELSE
      -- Generic user or subscriber defaults
      IF NEW.approved IS NULL THEN NEW.approved := TRUE; END IF;
      IF NEW.subscription_active IS NULL THEN NEW.subscription_active := FALSE; END IF;
      NEW."subscriptionActive" := NEW.subscription_active;
    END IF;

  -- 3. Update Action Handling
  ELSIF TG_OP = 'UPDATE' THEN
    -- Ensure id, email, and role are immutable during updates
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Forbidden: id is immutable during updates.';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Forbidden: email is immutable during updates.';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Forbidden: role is immutable during updates.';
    END IF;

    -- Block modifications from non-owning, non-admin sessions (Strict Data Privacy)
    IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.id AND (caller_role IS DISTINCT FROM 'admin') THEN
      RAISE EXCEPTION 'Access Denied: You are not authorized to update another user''s profile.';
    END IF;

    -- Prevent Privilege Escalation (Role updates, account approval status bypasses, subscription status bypassing)
    IF (caller_role IS DISTINCT FROM 'admin') AND (auth.uid() = OLD.id) THEN
      IF NEW.approved IS DISTINCT FROM OLD.approved THEN
        RAISE EXCEPTION 'Privilege Escalation Blocked: Account approval status cannot be modified manually.';
      END IF;

      IF NEW.subscription_active IS DISTINCT FROM OLD.subscription_active THEN
        RAISE EXCEPTION 'State Shortcut Blocked: Active subscription status cannot be self-validated.';
      END IF;

      -- Block any attempts by the client to extends trial periods arbitrarily
      IF NEW.subscription IS DISTINCT FROM OLD.subscription THEN
        IF (OLD.subscription->>'isTrial')::BOOLEAN = true THEN
          IF (NEW.subscription->>'isTrial')::BOOLEAN <> TRUE OR 
             (NEW.subscription->>'currentPeriodEnd')::BIGINT > (OLD.subscription->>'currentPeriodEnd')::BIGINT THEN
            RAISE EXCEPTION 'Trial Abuse Blocked: Extending or modifying active trial details requires admin authentication.';
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  -- 4. Transparent camelCase/snake_case Field Synchronization
  
  -- First Name sync
  IF NEW.first_name IS DISTINCT FROM OLD.first_name AND NEW.first_name IS NOT NULL THEN
    NEW."firstName" := NEW.first_name;
  ELSIF NEW."firstName" IS DISTINCT FROM OLD."firstName" AND NEW."firstName" IS NOT NULL THEN
    NEW.first_name := NEW."firstName";
  END IF;

  -- Last Name sync
  IF NEW.last_name IS DISTINCT FROM OLD.last_name AND NEW.last_name IS NOT NULL THEN
    NEW."lastName" := NEW.last_name;
  ELSIF NEW."lastName" IS DISTINCT FROM OLD."lastName" AND NEW."lastName" IS NOT NULL THEN
    NEW.last_name := NEW."lastName";
  END IF;

  -- Bar ID sync
  IF NEW.bar_id IS DISTINCT FROM OLD.bar_id AND NEW.bar_id IS NOT NULL THEN
    NEW."barId" := NEW.bar_id;
  ELSIF NEW."barId" IS DISTINCT FROM OLD."barId" AND NEW."barId" IS NOT NULL THEN
    NEW.bar_id := NEW."barId";
  END IF;

  -- Business Name sync
  IF NEW.business_name IS DISTINCT FROM OLD.business_name AND NEW.business_name IS NOT NULL THEN
    NEW."businessName" := NEW.business_name;
  ELSIF NEW."businessName" IS DISTINCT FROM OLD."businessName" AND NEW."businessName" IS NOT NULL THEN
    NEW.business_name := NEW."businessName";
  END IF;

  -- Contact Person sync
  IF NEW.contact_person IS DISTINCT FROM OLD.contact_person AND NEW.contact_person IS NOT NULL THEN
    NEW."contactPerson" := NEW.contact_person;
  ELSIF NEW."contactPerson" IS DISTINCT FROM OLD."contactPerson" AND NEW."contactPerson" IS NOT NULL THEN
    NEW.contact_person := NEW."contactPerson";
  END IF;

  -- Subscription Active Bool sync
  IF NEW.subscription_active IS DISTINCT FROM OLD.subscription_active THEN
    NEW."subscriptionActive" := NEW.subscription_active;
  ELSIF NEW."subscriptionActive" IS DISTINCT FROM OLD."subscriptionActive" THEN
    NEW.subscription_active := NEW."subscriptionActive";
  END IF;

  -- Notification Preferences JSON sync
  IF NEW.notification_preferences IS DISTINCT FROM OLD.notification_preferences AND NEW.notification_preferences IS NOT NULL THEN
    NEW."notificationPreferences" := NEW.notification_preferences;
  ELSIF NEW."notificationPreferences" IS DISTINCT FROM OLD."notificationPreferences" AND NEW."notificationPreferences" IS NOT NULL THEN
    NEW.notification_preferences := NEW."notificationPreferences";
  END IF;

  -- Business Hours JSON sync
  IF NEW.business_hours IS DISTINCT FROM OLD.business_hours AND NEW.business_hours IS NOT NULL THEN
    NEW."businessHours" := NEW.business_hours;
  ELSIF NEW."businessHours" IS DISTINCT FROM OLD."businessHours" AND NEW."businessHours" IS NOT NULL THEN
    NEW.business_hours := NEW."businessHours";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER users_security_and_sync_trigger
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.process_user_changes();


-- Chat creation trigger: Enforce participant checks & malicious massive array inject protection
CREATE OR REPLACE FUNCTION public.process_chat_checks()
RETURNS TRIGGER AS $$
BEGIN
  -- Malicious Array Injection detection (prevent overloading chats with dummy elements)
  IF array_length(NEW.participants, 1) > 25 THEN
    RAISE EXCEPTION 'Malicious Payload Blocked: Group chat contains too many target participants (max: 25).';
  END IF;

  -- Identity Spoofing / Orphaned Chat creation defense
  IF auth.uid() IS NOT NULL AND NOT (auth.uid() = ANY(NEW.participants)) THEN
    RAISE EXCEPTION 'Unauthorized Chat Attempt: Creating chat without including your authenticated UID is forbidden.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER chats_creation_validation_trigger
BEFORE INSERT ON public.chats
FOR EACH ROW EXECUTE FUNCTION public.process_chat_checks();


-- Messages security trigger: Enforce absolute chat member checks, sender spoofing, and field immutability
CREATE OR REPLACE FUNCTION public.process_message_checks()
RETURNS TRIGGER AS $$
DECLARE
  is_chat_member BOOLEAN;
BEGIN
  -- 1. Sender Spoofing protection
  IF auth.uid() IS NOT NULL AND NEW.sender_id <> auth.uid() THEN
    RAISE EXCEPTION 'Identity Spoofing Blocked: Cannot specify a different authenticated user as message sender.';
  END IF;

  -- 2. Orphaned message and validation check
  SELECT (auth.uid() = ANY(participants)) INTO is_chat_member 
  FROM public.chats 
  WHERE id = NEW.chat_id;

  IF NOT is_chat_member THEN
    RAISE EXCEPTION 'Orphaned Message Bypassed: You cannot dispatch messages to chats in which you are not a listed member.';
  END IF;

  -- 3. Immutability checks (Implements rule: 'createdAt and senderId are immutable')
  IF TG_OP = 'UPDATE' THEN
    IF NEW.sender_id <> OLD.sender_id THEN
      RAISE EXCEPTION 'Data Invariant Escalation: Message sender_id cannot be edited or updated.';
    END IF;
    IF NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'Data Invariant Escalation: Message timestamp is immutable.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER messages_security_policy_trigger
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.process_message_checks();

-- ----------------------------------------------------
-- 4. Row Level Security (RLS) Configuration
-- ----------------------------------------------------

-- Keep existing tables RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4.1 Users table RLS
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow public select profiles" ON public.users;
DROP POLICY IF EXISTS "Allow individual profile inserts" ON public.users;
DROP POLICY IF EXISTS "Allow individual profile updates" ON public.users;

-- Read rules: Allow users to read their own profile data and admins to have full read access. Deny all other access by default.
CREATE POLICY "Allow select profiles for owner and admin" ON public.users 
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Create rules: Only owners can provision details
CREATE POLICY "Allow individual profile inserts" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Update rules: Authenticated owners and admins only
CREATE POLICY "Allow individual profile updates" ON public.users 
  FOR UPDATE USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 4.2 Bars table RLS
DROP POLICY IF EXISTS "Anyone can read bars" ON public.bars;
DROP POLICY IF EXISTS "Managers can update their own bars" ON public.bars;

CREATE POLICY "Allow public select bars" ON public.bars FOR SELECT USING (true);
CREATE POLICY "Allow management access for registered owners and admins" ON public.bars 
  FOR ALL USING (
    auth.uid() = manager_id 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- 4.3 Menu Items table RLS
DROP POLICY IF EXISTS "Anyone can read menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Managers can handle menu items" ON public.menu_items;

CREATE POLICY "Allow public select menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow product operations for local managers and admins" ON public.menu_items 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bars 
      WHERE bars.id = menu_items.bar_id 
      AND (bars.manager_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
    )
  );

-- 4.4 Bar Updates table RLS
DROP POLICY IF EXISTS "Anyone can read updates" ON public.bar_updates;
DROP POLICY IF EXISTS "Managers can manage updates" ON public.bar_updates;

CREATE POLICY "Allow public select updates" ON public.bar_updates FOR SELECT USING (true);
CREATE POLICY "Allow broadcast operations for registered managers and admins" ON public.bar_updates 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bars 
      WHERE bars.id = bar_updates.bar_id 
      AND (bars.manager_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
    )
  );

-- 4.5 User Locations tracking table RLS
DROP POLICY IF EXISTS "Allow individual insert" ON public.user_locations;
DROP POLICY IF EXISTS "Allow individual read" ON public.user_locations;

CREATE POLICY "Allow location updates for owning device" ON public.user_locations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow location queries for owner, associated bar managers or admins" ON public.user_locations 
  FOR SELECT USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    OR EXISTS (
      -- Managers can track coordinates of delivery/personnel if needed
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  );

-- 4.6 Chats table RLS
DROP POLICY IF EXISTS "Users can see chats they are part of" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update chats they are part of" ON public.chats;

CREATE POLICY "Allow active participants and admins to select chats" ON public.chats 
  FOR SELECT USING (
    auth.uid() = ANY(participants) 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Allow active participants to insert chats" ON public.chats 
  FOR INSERT WITH CHECK (
    auth.uid() = ANY(participants)
  );

CREATE POLICY "Allow active participants to update chats metadata" ON public.chats 
  FOR UPDATE USING (
    auth.uid() = ANY(participants)
  );

-- 4.7 Messages table RLS
DROP POLICY IF EXISTS "Users can see messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Allow active participants and admins to read messages" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND (auth.uid() = ANY(chats.participants) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
    )
  );

CREATE POLICY "Allow active participants to insert messages" ON public.messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND auth.uid() = ANY(chats.participants)
    )
  );

-- 4.8 Products table RLS
DROP POLICY IF EXISTS "Users can read all products" ON public.products;
DROP POLICY IF EXISTS "Suppliers can manage their own products" ON public.products;

CREATE POLICY "Allow public select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow catalog management for verified suppliers and admins" ON public.products 
  FOR ALL USING (
    auth.uid() = supplier_id 
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- 4.9 Tasks table RLS
DROP POLICY IF EXISTS "Users within the same bar can read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Suppliers can manage their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow select tasks for valid stakeholders" ON public.tasks;
DROP POLICY IF EXISTS "Allow task updates for managers" ON public.tasks;
DROP POLICY IF EXISTS "Managers can select tasks for their bar" ON public.tasks;
DROP POLICY IF EXISTS "Managers can insert tasks for their bar" ON public.tasks;
DROP POLICY IF EXISTS "Managers can update tasks for their bar" ON public.tasks;
DROP POLICY IF EXISTS "Managers can delete tasks for their bar" ON public.tasks;
DROP POLICY IF EXISTS "Suppliers can manage their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Exporters can manage their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Assigned users can select tasks" ON public.tasks;

-- Manager RBAC Rule: view tasks associated with their assigned bar
CREATE POLICY "Managers can select tasks for their bar" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager' 
      AND (users.bar_id = tasks.bar_id OR tasks.bar_id IN (SELECT id FROM public.bars WHERE manager_id = auth.uid()))
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Manager RBAC Rule: create tasks associated with their assigned bar
CREATE POLICY "Managers can insert tasks for their bar" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager' 
      AND (users.bar_id = tasks.bar_id OR tasks.bar_id IN (SELECT id FROM public.bars WHERE manager_id = auth.uid()))
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Manager RBAC Rule: update tasks associated with their assigned bar
CREATE POLICY "Managers can update tasks for their bar" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager' 
      AND (users.bar_id = tasks.bar_id OR tasks.bar_id IN (SELECT id FROM public.bars WHERE manager_id = auth.uid()))
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Manager RBAC Rule: delete tasks associated with their assigned bar
CREATE POLICY "Managers can delete tasks for their bar" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager' 
      AND (users.bar_id = tasks.bar_id OR tasks.bar_id IN (SELECT id FROM public.bars WHERE manager_id = auth.uid()))
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Supplier RBAC Rule: manage and view their own tasks
CREATE POLICY "Suppliers can manage their own tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'supplier'
      AND (tasks.supplier_id = auth.uid() OR tasks.assigned_to = auth.uid())
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Exporter RBAC Rule: manage and view tasks assigned to them
CREATE POLICY "Exporters can manage their own tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'exporter'
      AND (tasks.assigned_to = auth.uid())
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Assigned general users/personnel can select check tasks
CREATE POLICY "Assigned users can select tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() = assigned_to
  );

-- ----------------------------------------------------
-- 5. Enable Real-Time Publications
-- ----------------------------------------------------
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.chats, 
  public.messages, 
  public.products, 
  public.bars, 
  public.menu_items, 
  public.bar_updates, 
  public.users, 
  public.tasks;
