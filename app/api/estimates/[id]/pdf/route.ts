import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Define types for jsPDF extended with autotable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get Estimate
    const { data: estimate, error } = await supabase
      .from('estimates')
      .select('*, contact:contacts(*), estimate_items(*)')
      .eq('id', params.id)
      .single()

    if (error || !estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

    // Generate PDF
    const doc = new jsPDF() as jsPDFWithAutoTable
    
    // Header
    doc.setFontSize(20)
    doc.text('ESTIMATE', 14, 22)
    
    doc.setFontSize(10)
    doc.text(`Estimate #: ${estimate.estimate_number}`, 14, 30)
    doc.text(`Date: ${new Date(estimate.created_at).toLocaleDateString()}`, 14, 35)
    if (estimate.valid_until) {
      doc.text(`Valid Until: ${new Date(estimate.valid_until).toLocaleDateString()}`, 14, 40)
    }

    // Customer Info
    doc.text('To:', 14, 50)
    doc.setFontSize(12)
    doc.text(estimate.contact?.name || 'Valued Customer', 14, 56)
    doc.setFontSize(10)
    if (estimate.contact?.email) doc.text(estimate.contact.email, 14, 62)
    if (estimate.contact?.phone) doc.text(estimate.contact.phone, 14, 67)

    // Items Table
    const tableColumn = ["Item", "Description", "Qty", "Unit", "Price", "Total"]
    const tableRows = []

    if (estimate.estimate_items) {
      estimate.estimate_items.forEach((item: any) => {
        const itemData = [
          item.name,
          item.description || '',
          item.quantity,
          item.unit,
          `$${(item.unit_price / 100).toFixed(2)}`,
          `$${(item.total_price / 100).toFixed(2)}`
        ]
        tableRows.push(itemData)
      })
    }

    autoTable(doc, {
      startY: 75,
      head: [tableColumn],
      body: tableRows,
    })

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10
    
    doc.text(`Subtotal: $${(estimate.subtotal / 100).toFixed(2)}`, 140, finalY)
    doc.text(`Tax: $${(estimate.tax_amount / 100).toFixed(2)}`, 140, finalY + 5)
    doc.setFontSize(12)
    doc.text(`Total: $${(estimate.total_amount / 100).toFixed(2)}`, 140, finalY + 12)

    // Output PDF
    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Estimate-${estimate.estimate_number}.pdf"`
      }
    })

  } catch (error) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
