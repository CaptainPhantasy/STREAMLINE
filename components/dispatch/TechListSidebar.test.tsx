/**
 * TechListSidebar Component Tests
 *
 * Tests for the TechListSidebar component functionality including:
 * - Rendering
 * - Search filtering
 * - Status filtering
 * - Sorting
 * - Distance calculations
 * - User interactions
 */

import { render, screen, fireEvent, within } from '@testing-library/react'
import TechListSidebar from './TechListSidebar'
import type { TechLocation } from '@/types/dispatch'

// Mock tech data
const mockTechs: TechLocation[] = [
  {
    id: 'tech-1',
    name: 'Alice Johnson',
    role: 'tech',
    status: 'on_job',
    currentJob: {
      id: 'job-1',
      description: 'Water heater repair',
      address: '123 Main St'
    },
    lastLocation: {
      lat: 39.7684,
      lng: -86.1581,
      accuracy: 10,
      updatedAt: new Date().toISOString()
    }
  },
  {
    id: 'tech-2',
    name: 'Bob Smith',
    role: 'tech',
    status: 'idle',
    lastLocation: {
      lat: 39.7700,
      lng: -86.1600,
      accuracy: 15,
      updatedAt: new Date(Date.now() - 300000).toISOString() // 5 mins ago
    }
  },
  {
    id: 'tech-3',
    name: 'Charlie Davis',
    role: 'tech',
    status: 'en_route',
    currentJob: {
      id: 'job-2',
      description: 'AC installation',
      address: '456 Oak Ave'
    },
    lastLocation: {
      lat: 39.7650,
      lng: -86.1550,
      accuracy: 12,
      updatedAt: new Date(Date.now() - 60000).toISOString() // 1 min ago
    }
  },
  {
    id: 'tech-4',
    name: 'Diana Wilson',
    role: 'tech',
    status: 'offline'
  }
]

const mockSelectedJobLocation = {
  lat: 39.7680,
  lng: -86.1575
}

describe('TechListSidebar', () => {
  const defaultProps = {
    techs: mockTechs,
    onTechClick: jest.fn(),
    onTechHover: jest.fn(),
    selectedTechId: null,
    selectedJobId: null,
    selectedJobLocation: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders sidebar with all techs', () => {
      render(<TechListSidebar {...defaultProps} />)

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
      expect(screen.getByText('Charlie Davis')).toBeInTheDocument()
      expect(screen.getByText('Diana Wilson')).toBeInTheDocument()
    })

    it('displays status badges for each tech', () => {
      render(<TechListSidebar {...defaultProps} />)

      expect(screen.getByText('ON JOB')).toBeInTheDocument()
      expect(screen.getByText('IDLE')).toBeInTheDocument()
      expect(screen.getByText('EN ROUTE')).toBeInTheDocument()
      expect(screen.getByText('OFFLINE')).toBeInTheDocument()
    })

    it('displays current job for techs on job', () => {
      render(<TechListSidebar {...defaultProps} />)

      expect(screen.getByText(/Water heater repair/)).toBeInTheDocument()
      expect(screen.getByText(/AC installation/)).toBeInTheDocument()
    })

    it('displays tech count in footer', () => {
      render(<TechListSidebar {...defaultProps} />)

      expect(screen.getByText(/Showing 4 of 4 techs/)).toBeInTheDocument()
    })

    it('highlights selected tech', () => {
      render(<TechListSidebar {...defaultProps} selectedTechId="tech-1" />)

      const selectedTech = screen.getByText('Alice Johnson').closest('button')
      expect(selectedTech).toHaveClass('bg-blue-900')
    })
  })

  describe('Search Filtering', () => {
    it('filters techs by name (case insensitive)', () => {
      render(<TechListSidebar {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search techs...')
      fireEvent.change(searchInput, { target: { value: 'alice' } })

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Charlie Davis')).not.toBeInTheDocument()
      expect(screen.queryByText('Diana Wilson')).not.toBeInTheDocument()
    })

    it('shows "No techs found" when search has no results', () => {
      render(<TechListSidebar {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search techs...')
      fireEvent.change(searchInput, { target: { value: 'xyz' } })

      expect(screen.getByText('No techs found')).toBeInTheDocument()
    })

    it('clears search when X button is clicked', () => {
      render(<TechListSidebar {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search techs...')
      fireEvent.change(searchInput, { target: { value: 'alice' } })

      const clearButton = screen.getByRole('button', { name: '' }) // X icon button
      fireEvent.click(clearButton)

      expect(searchInput).toHaveValue('')
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    })
  })

  describe('Status Filtering', () => {
    it('displays correct status counts', () => {
      render(<TechListSidebar {...defaultProps} />)

      expect(screen.getByText('All (4)')).toBeInTheDocument()
      expect(screen.getByText('On Job (1)')).toBeInTheDocument()
      expect(screen.getByText('En Route (1)')).toBeInTheDocument()
      expect(screen.getByText('Idle (1)')).toBeInTheDocument()
      expect(screen.getByText('Offline (1)')).toBeInTheDocument()
    })

    it('filters by on_job status', () => {
      render(<TechListSidebar {...defaultProps} />)

      const onJobButton = screen.getByText('On Job (1)')
      fireEvent.click(onJobButton)

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument()
      expect(screen.getByText(/Showing 1 of 4 techs/)).toBeInTheDocument()
    })

    it('filters by idle status', () => {
      render(<TechListSidebar {...defaultProps} />)

      const idleButton = screen.getByText('Idle (1)')
      fireEvent.click(idleButton)

      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument()
    })

    it('shows all techs when All filter is selected', () => {
      render(<TechListSidebar {...defaultProps} />)

      // First filter by idle
      fireEvent.click(screen.getByText('Idle (1)'))
      expect(screen.getByText(/Showing 1 of 4 techs/)).toBeInTheDocument()

      // Then click All
      fireEvent.click(screen.getByText('All (4)'))
      expect(screen.getByText(/Showing 4 of 4 techs/)).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('sorts by name (A-Z) by default', () => {
      render(<TechListSidebar {...defaultProps} />)

      const techButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('h3')
      )
      const names = techButtons.map(btn => btn.querySelector('h3')?.textContent)

      expect(names).toEqual(['Alice Johnson', 'Bob Smith', 'Charlie Davis', 'Diana Wilson'])
    })

    it('cycles through sort options when sort button is clicked', () => {
      render(<TechListSidebar {...defaultProps} />)

      const sortButton = screen.getByTitle(/Sort by:/)

      expect(sortButton).toHaveTextContent('name')

      fireEvent.click(sortButton)
      expect(sortButton).toHaveTextContent('status')

      fireEvent.click(sortButton)
      expect(sortButton).toHaveTextContent('distance')

      fireEvent.click(sortButton)
      expect(sortButton).toHaveTextContent('name')
    })

    it('sorts by distance when job location is provided', () => {
      render(<TechListSidebar
        {...defaultProps}
        selectedJobLocation={mockSelectedJobLocation}
      />)

      // Change sort to distance
      const sortButton = screen.getByTitle(/Sort by:/)
      fireEvent.click(sortButton) // name -> status
      fireEvent.click(sortButton) // status -> distance

      // Alice (tech-1) should be closest to job location
      const techButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('h3')
      )
      const firstTech = techButtons[0]
      expect(within(firstTech).getByText('Alice Johnson')).toBeInTheDocument()
    })
  })

  describe('Distance Calculations', () => {
    it('shows distance to selected job when job location provided', () => {
      render(<TechListSidebar
        {...defaultProps}
        selectedJobId="job-1"
        selectedJobLocation={mockSelectedJobLocation}
      />)

      // Should show distance for techs with locations
      expect(screen.getByText(/from job/)).toBeInTheDocument()
    })

    it('does not show distance when no job selected', () => {
      render(<TechListSidebar {...defaultProps} />)

      expect(screen.queryByText(/from job/)).not.toBeInTheDocument()
    })

    it('formats distance in miles for distances > 1 mile', () => {
      const farJobLocation = { lat: 40.0000, lng: -87.0000 } // ~100+ miles away

      render(<TechListSidebar
        {...defaultProps}
        selectedJobLocation={farJobLocation}
      />)

      expect(screen.getByText(/mi from job/)).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('calls onTechClick when tech is clicked', () => {
      const onTechClick = jest.fn()
      render(<TechListSidebar {...defaultProps} onTechClick={onTechClick} />)

      const aliceTech = screen.getByText('Alice Johnson').closest('button')
      fireEvent.click(aliceTech!)

      expect(onTechClick).toHaveBeenCalledWith(mockTechs[0])
    })

    it('calls onTechHover on mouse enter', () => {
      const onTechHover = jest.fn()
      render(<TechListSidebar {...defaultProps} onTechHover={onTechHover} />)

      const aliceTech = screen.getByText('Alice Johnson').closest('button')
      fireEvent.mouseEnter(aliceTech!)

      expect(onTechHover).toHaveBeenCalledWith('tech-1')
    })

    it('calls onTechHover with null on mouse leave', () => {
      const onTechHover = jest.fn()
      render(<TechListSidebar {...defaultProps} onTechHover={onTechHover} />)

      const aliceTech = screen.getByText('Alice Johnson').closest('button')
      fireEvent.mouseLeave(aliceTech!)

      expect(onTechHover).toHaveBeenCalledWith(null)
    })
  })

  describe('Collapse/Expand', () => {
    it('collapses sidebar when collapse button is clicked', () => {
      render(<TechListSidebar {...defaultProps} />)

      const collapseButton = screen.getByTitle('Collapse sidebar')
      fireEvent.click(collapseButton)

      // Should show expand button
      expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument()
    })

    it('expands sidebar when expand button is clicked', () => {
      render(<TechListSidebar {...defaultProps} />)

      // First collapse
      const collapseButton = screen.getByTitle('Collapse sidebar')
      fireEvent.click(collapseButton)

      // Then expand
      const expandButton = screen.getByTitle('Expand sidebar')
      fireEvent.click(expandButton)

      expect(screen.getByTitle('Collapse sidebar')).toBeInTheDocument()
    })
  })

  describe('Timestamp Formatting', () => {
    it('shows "Just now" for very recent updates', () => {
      const recentTech: TechLocation = {
        ...mockTechs[0],
        lastLocation: {
          lat: 39.7684,
          lng: -86.1581,
          accuracy: 10,
          updatedAt: new Date().toISOString()
        }
      }

      render(<TechListSidebar {...defaultProps} techs={[recentTech]} />)

      expect(screen.getByText(/Just now/)).toBeInTheDocument()
    })

    it('shows minutes ago for recent updates', () => {
      const recentTech: TechLocation = {
        ...mockTechs[1],
        lastLocation: {
          lat: 39.7684,
          lng: -86.1581,
          accuracy: 10,
          updatedAt: new Date(Date.now() - 300000).toISOString() // 5 mins ago
        }
      }

      render(<TechListSidebar {...defaultProps} techs={[recentTech]} />)

      expect(screen.getByText(/5m ago/)).toBeInTheDocument()
    })

    it('shows "No location data" for techs without location', () => {
      render(<TechListSidebar {...defaultProps} techs={[mockTechs[3]]} />)

      expect(screen.getByText('No location data')).toBeInTheDocument()
    })
  })

  describe('GPS Accuracy Display', () => {
    it('displays GPS accuracy when available', () => {
      render(<TechListSidebar {...defaultProps} />)

      expect(screen.getByText(/±10m/)).toBeInTheDocument()
      expect(screen.getByText(/±15m/)).toBeInTheDocument()
    })
  })
})
