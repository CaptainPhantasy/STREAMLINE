/**
 * Report Export API
 * POST /api/reports/export
 * Export reports to PDF, Excel, or CSV
 *
 * Agent Swarm 7: Reports & Analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, filters, format, includeCharts = false } = body

    if (!type || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Construct API URL to fetch report data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      from: filters.dateRange.from,
      to: filters.dateRange.to,
    })

    if (filters.techId) params.append('techId', filters.techId)
    if (filters.customerId) params.append('customerId', filters.customerId)
    if (filters.jobStatus?.[0]) params.append('status', filters.jobStatus[0])

    const reportUrl = `${baseUrl}/api/reports/${type}?${params.toString()}`

    // Fetch report data
    const reportResponse = await fetch(reportUrl, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    })

    if (!reportResponse.ok) {
      throw new Error('Failed to fetch report data')
    }

    const { data: reportData } = await reportResponse.json()

    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(type, reportData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-report-${Date.now()}.csv"`,
        },
      })
    }

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF(type, reportData, filters)
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${type}-report-${Date.now()}.pdf"`,
        },
      })
    }

    if (format === 'excel') {
      // For now, return CSV for Excel (would need xlsx library for true Excel)
      const csv = generateCSV(type, reportData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-report-${Date.now()}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function generateCSV(type: string, data: any): string {
  let headers: string[] = []
  let rows: any[][] = []

  switch (type) {
    case 'revenue':
      headers = ['Date', 'Revenue', 'Job Count']
      rows = (data.revenueByPeriod || []).map((item: any) => [
        item.date,
        `$${(item.revenue / 100).toFixed(2)}`,
        item.jobCount,
      ])
      break

    case 'job-performance':
      headers = ['Status', 'Count', 'Percentage']
      rows = (data.jobsByStatus || []).map((item: any) => [
        item.status,
        item.count,
        `${item.percentage}%`,
      ])
      break

    case 'customer':
      headers = ['Customer', 'Revenue', 'Jobs', 'Lifetime Value']
      rows = (data.topCustomers || []).map((item: any) => [
        item.customerName,
        `$${(item.totalRevenue / 100).toFixed(2)}`,
        item.jobCount,
        `$${(item.lifetimeValue / 100).toFixed(2)}`,
      ])
      break

    case 'tech-performance':
      headers = ['Tech', 'Jobs Completed', 'Revenue']
      rows = (data.techComparison || []).map((item: any) => [
        item.techName,
        item.jobsCompleted,
        `$${(item.revenue / 100).toFixed(2)}`,
      ])
      break

    case 'financial':
      headers = ['Month', 'Revenue', 'Expenses', 'Profit']
      rows = (data.paymentTrends || []).map((item: any) => [
        item.month,
        `$${(item.revenue / 100).toFixed(2)}`,
        `$${(item.expenses / 100).toFixed(2)}`,
        `$${(item.profit / 100).toFixed(2)}`,
      ])
      break

    default:
      headers = ['No Data']
      rows = []
  }

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csvContent
}

async function generatePDF(type: string, data: any, filters: any): Promise<Buffer> {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text(getReportTitle(type), 14, 20)

  // Date range
  doc.setFontSize(10)
  const fromDate = new Date(filters.dateRange.from).toLocaleDateString()
  const toDate = new Date(filters.dateRange.to).toLocaleDateString()
  doc.text(`Report Period: ${fromDate} - ${toDate}`, 14, 28)

  // Generate table based on report type
  let headers: string[] = []
  let rows: any[][] = []

  switch (type) {
    case 'revenue':
      headers = ['Date', 'Revenue', 'Job Count']
      rows = (data.revenueByPeriod || []).map((item: any) => [
        item.date,
        `$${(item.revenue / 100).toFixed(2)}`,
        item.jobCount,
      ])
      break

    case 'job-performance':
      headers = ['Status', 'Count', 'Percentage']
      rows = (data.jobsByStatus || []).map((item: any) => [
        item.status,
        item.count,
        `${item.percentage}%`,
      ])
      break

    case 'customer':
      headers = ['Customer', 'Revenue', 'Jobs']
      rows = (data.topCustomers || []).map((item: any) => [
        item.customerName,
        `$${(item.totalRevenue / 100).toFixed(2)}`,
        item.jobCount,
      ])
      break

    case 'tech-performance':
      headers = ['Tech', 'Jobs', 'Revenue']
      rows = (data.techComparison || []).map((item: any) => [
        item.techName,
        item.jobsCompleted,
        `$${(item.revenue / 100).toFixed(2)}`,
      ])
      break

    case 'financial':
      headers = ['Month', 'Revenue', 'Expenses', 'Profit']
      rows = (data.paymentTrends || []).map((item: any) => [
        item.month,
        `$${(item.revenue / 100).toFixed(2)}`,
        `$${(item.expenses / 100).toFixed(2)}`,
        `$${(item.profit / 100).toFixed(2)}`,
      ])
      break
  }

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  })

  // Add footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  doc.setFontSize(8)
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    14,
    doc.internal.pageSize.height - 10
  )

  return Buffer.from(doc.output('arraybuffer'))
}

function getReportTitle(type: string): string {
  const titles: Record<string, string> = {
    revenue: 'Revenue Report',
    'job-performance': 'Job Performance Report',
    customer: 'Customer Analytics Report',
    'tech-performance': 'Tech Performance Report',
    financial: 'Financial Overview Report',
  }
  return titles[type] || 'Report'
}
