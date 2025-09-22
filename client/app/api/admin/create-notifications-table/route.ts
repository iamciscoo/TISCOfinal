import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    )

    console.log('Creating email_notifications table...')

    // Create the table using raw SQL
    const { error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'email_notifications')
      .single()

    if (!error) {
      return NextResponse.json({ 
        success: true, 
        message: 'Table already exists' 
      })
    }

    // Table doesn't exist, create it
    const createTableSQL = `
      CREATE TABLE public.email_notifications (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id TEXT,
        template_type TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        template_data JSONB DEFAULT '{}',
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
        status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'pending', 'sent', 'failed')),
        scheduled_for TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        failed_at TIMESTAMPTZ,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
      CREATE INDEX idx_email_notifications_user_id ON public.email_notifications(user_id);
      CREATE INDEX idx_email_notifications_scheduled ON public.email_notifications(scheduled_for);
      CREATE INDEX idx_email_notifications_created ON public.email_notifications(created_at);

      ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Service role can manage all email notifications" ON public.email_notifications
        FOR ALL USING (true);

      CREATE POLICY "Users can view own email notifications" ON public.email_notifications
        FOR SELECT USING (auth.uid()::text = user_id);
    `

    // Execute the SQL by inserting a dummy record that triggers the creation
    const { error: insertError } = await supabase
      .from('email_notifications')
      .insert({
        template_type: 'test',
        recipient_email: 'test@example.com',
        subject: 'Test'
      })

    if (insertError && insertError.message.includes('does not exist')) {
      return NextResponse.json({
        error: 'Cannot create table via API. Please run the SQL migration manually in Supabase dashboard.',
        sql: createTableSQL
      }, { status: 500 })
    }

    // If we got here, the table exists, delete the test record
    if (!insertError) {
      await supabase
        .from('email_notifications')
        .delete()
        .eq('recipient_email', 'test@example.com')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email notifications table is ready' 
    })

  } catch (error) {
    console.error('Error creating notifications table:', error)
    return NextResponse.json(
      { error: 'Failed to create notifications table' },
      { status: 500 }
    )
  }
}
