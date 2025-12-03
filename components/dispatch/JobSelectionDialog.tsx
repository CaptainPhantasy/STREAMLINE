'use client'

import React, { useState, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MapPin, User, Search, Briefcase } from 'lucide-react'
import type { JobLocation } from '@/types/dispatch'
import { jobStatusColors } from '@/types/dispatch'

interface JobSelectionDialogProps {
    open: boolean
    onClose: () => void
    onSelect: (job: JobLocation) => void
    jobs: JobLocation[]
}

export function JobSelectionDialog({
    open,
    onClose,
    onSelect,
    jobs,
}: JobSelectionDialogProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const unassignedJobs = useMemo(() => {
        return jobs.filter(job => !job.assignedTech)
    }, [jobs])

    const filteredJobs = useMemo(() => {
        if (!searchQuery) return unassignedJobs

        const query = searchQuery.toLowerCase()
        return unassignedJobs.filter(job =>
            job.description.toLowerCase().includes(query) ||
            job.customer.name.toLowerCase().includes(query) ||
            job.customer.address.toLowerCase().includes(query) ||
            job.id.toLowerCase().includes(query)
        )
    }, [unassignedJobs, searchQuery])

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        Select Job to Assign
                    </DialogTitle>
                    <DialogDescription>
                        Choose an unassigned job to assign to the technician.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search jobs by customer, address, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="space-y-3">
                    {filteredJobs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No unassigned jobs found matching your search.</p>
                        </div>
                    ) : (
                        filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => onSelect(job)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-900">{job.description}</h4>
                                    <Badge
                                        variant="outline"
                                        style={{
                                            borderColor: jobStatusColors[job.status].marker,
                                            color: jobStatusColors[job.status].marker,
                                            backgroundColor: `${jobStatusColors[job.status].marker}10`
                                        }}
                                    >
                                        {job.status.toUpperCase()}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span>{job.customer.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="truncate">{job.customer.address}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
