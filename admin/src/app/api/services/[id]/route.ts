import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching service:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in service GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      features,
      duration,
      image,
      display_order,
      is_active,
    } = body as Partial<{ 
      title: string; 
      description: string; 
      features: string[]; 
      duration: string; 
      image: string; 
      display_order: number;
      is_active: boolean;
    }>

    const { id } = await context.params

    // Handle smart ordering logic if display_order is being updated
    if (display_order !== undefined) {
      // Get current service data
      const { data: currentService } = await supabase
        .from('services')
        .select('display_order')
        .eq('id', id)
        .single()

      const oldPosition = currentService?.display_order ?? 0
      const newPosition = display_order

      if (currentService && oldPosition !== newPosition) {
        // Check if another service already has this display_order
        const { data: conflictingService } = await supabase
          .from('services')
          .select('id, display_order')
          .eq('display_order', newPosition)
          .neq('id', id)
          .maybeSingle()

        if (conflictingService) {
          // CASE 1: Swap positions
          // Give the conflicting service the current service's old position
          await supabase
            .from('services')
            .update({ display_order: oldPosition })
            .eq('id', conflictingService.id)

          console.log(`✓ Swapped: Service ${conflictingService.id} moved from ${newPosition} to ${oldPosition}`)
        } else {
          // CASE 2: No conflict - shift others if needed
          // Get all services to reorder
          const { data: allServices } = await supabase
            .from('services')
            .select('id, display_order')
            .neq('id', id)
            .order('display_order', { ascending: true })

          if (allServices && allServices.length > 0) {
            // Moving down (to a higher number)
            if (newPosition > oldPosition) {
              // Shift services between old and new position up by 1
              const toShift = allServices.filter(
                s => s.display_order > oldPosition && s.display_order <= newPosition
              )
              
              for (const service of toShift) {
                await supabase
                  .from('services')
                  .update({ display_order: service.display_order - 1 })
                  .eq('id', service.id)
              }
              
              console.log(`✓ Shifted ${toShift.length} services up (moving service down)`)
            } 
            // Moving up (to a lower number)
            else if (newPosition < oldPosition) {
              // Shift services between new and old position down by 1
              const toShift = allServices.filter(
                s => s.display_order >= newPosition && s.display_order < oldPosition
              )
              
              for (const service of toShift) {
                await supabase
                  .from('services')
                  .update({ display_order: service.display_order + 1 })
                  .eq('id', service.id)
              }
              
              console.log(`✓ Shifted ${toShift.length} services down (moving service up)`)
            }
          }
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (features !== undefined) updateData.features = features
    if (duration !== undefined) updateData.duration = duration
    if (image !== undefined) updateData.image = image
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active

    // Update the service
    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in service PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Soft deletion: set is_active to false instead of deleting
    // This preserves booking history and maintains referential integrity
    const { data, error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error archiving service:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Service archived successfully',
      data 
    })
  } catch (error) {
    console.error('Error in service DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
