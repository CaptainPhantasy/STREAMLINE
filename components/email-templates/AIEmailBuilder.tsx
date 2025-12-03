'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, Save, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface AIEmailBuilderProps {
  onTemplateCreated?: (template: {
    name: string
    subject: string
    body_html: string
    body_text: string
    variables: string[]
    template_type: string
  }) => void
}

export function AIEmailBuilder({ onTemplateCreated }: AIEmailBuilderProps) {
  const [mode, setMode] = useState<'paste' | 'describe'>('paste')
  const [pastedEmail, setPastedEmail] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [description, setDescription] = useState('')
  const [templateType, setTemplateType] = useState<string>('custom')
  const [tone, setTone] = useState<string>('professional')
  const [generating, setGenerating] = useState(false)
  const [generatedTemplate, setGeneratedTemplate] = useState<{
    name: string
    subject: string
    body_html: string
    body_text: string
    variables: string[]
    template_type: string
    subject_suggestions?: string[]
  } | null>(null)

  async function handleConvertPasted() {
    if (!pastedEmail.trim()) {
      toast.error('Please paste an email')
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/email-templates/ai-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_content: pastedEmail,
          email_subject: emailSubject,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to convert email')
      }

      const data = await response.json()
      setGeneratedTemplate(data.template)
      toast.success('Email converted to template!')
    } catch (error: any) {
      console.error('Error converting email:', error)
      toast.error(error.message || 'Failed to convert email')
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateFromDescription() {
    if (!description.trim()) {
      toast.error('Please describe the template you want to create')
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/email-templates/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          template_type: templateType,
          tone,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate template')
      }

      const data = await response.json()
      setGeneratedTemplate(data.template)
      toast.success('Template generated!')
    } catch (error: any) {
      console.error('Error generating template:', error)
      toast.error(error.message || 'Failed to generate template')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveTemplate() {
    if (!generatedTemplate) return

    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: generatedTemplate.name,
          subject: generatedTemplate.subject,
          bodyHtml: generatedTemplate.body_html,
          bodyText: generatedTemplate.body_text,
          templateType: generatedTemplate.template_type,
          variables: generatedTemplate.variables,
          isActive: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save template')
      }

      const data = await response.json()
      toast.success('Template saved!')
      onTemplateCreated?.(data.template)
      
      // Reset form
      setPastedEmail('')
      setEmailSubject('')
      setDescription('')
      setGeneratedTemplate(null)
    } catch (error: any) {
      console.error('Error saving template:', error)
      toast.error(error.message || 'Failed to save template')
    }
  }

  function handleCopyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Email Template Builder
        </CardTitle>
        <CardDescription>
          Convert emails to templates or create new templates from descriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'paste' | 'describe')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Paste Email</TabsTrigger>
            <TabsTrigger value="describe">Describe Template</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-2">
              <Label>Email Subject (Optional)</Label>
              <Input
                placeholder="Email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Paste Email Content</Label>
              <Textarea
                placeholder="Paste your email here..."
                value={pastedEmail}
                onChange={(e) => setPastedEmail(e.target.value)}
                rows={10}
              />
            </div>
            <Button
              onClick={handleConvertPasted}
              disabled={generating || !pastedEmail.trim()}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Convert to Template
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="describe" className="space-y-4">
            <div className="space-y-2">
              <Label>Template Description</Label>
              <Textarea
                placeholder="Describe the email template you want to create (e.g., 'A follow-up email to customers after job completion asking for a review')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="review_request">Review Request</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleGenerateFromDescription}
              disabled={generating || !description.trim()}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Template
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Generated Template Preview */}
        {generatedTemplate && (
          <div className="mt-6 space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Generated Template</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input value={generatedTemplate.name} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="flex gap-2">
                  <Input value={generatedTemplate.subject} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyToClipboard(generatedTemplate.subject)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {generatedTemplate.subject_suggestions &&
                  generatedTemplate.subject_suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Alternative subjects:</p>
                      {generatedTemplate.subject_suggestions.map((suggestion, idx) => (
                        <p key={idx} className="text-xs text-gray-600 pl-2">
                          • {suggestion}
                        </p>
                      ))}
                    </div>
                  )}
              </div>

              <div className="space-y-2">
                <Label>Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {generatedTemplate.variables.map((variable, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {variable}
                    </span>
                  ))}
                </div>
              </div>

              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>HTML Body</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard(generatedTemplate.body_html)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={generatedTemplate.body_html}
                    readOnly
                    rows={12}
                    className="font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="text" className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Plain Text Body</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard(generatedTemplate.body_text)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={generatedTemplate.body_text}
                    readOnly
                    rows={12}
                    className="font-mono text-sm"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

