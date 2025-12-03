'use client'

import { useState, useRef, useEffect } from 'react'
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

const LIBRARIES: ("places")[] = ["places"]

interface PlacesAutocompleteProps {
    value: string
    onChange: (value: string) => void
    onPlaceSelect?: (place: google.maps.places.PlaceResult) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    id?: string
}

export function PlacesAutocomplete({
    value,
    onChange,
    onPlaceSelect,
    placeholder = "Enter address...",
    disabled = false,
    className,
    id
}: PlacesAutocompleteProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES
    })

    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)

    // Handle place selection
    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace()

            // Update the input value with the formatted address
            if (place.formatted_address) {
                onChange(place.formatted_address)
            }

            // Notify parent of full place details
            if (onPlaceSelect) {
                onPlaceSelect(place)
            }
        }
    }

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value)
    }

    if (!isLoaded) {
        return (
            <div className="relative">
                <Input
                    disabled
                    placeholder="Loading maps..."
                    className={className}
                />
                <div className="absolute right-3 top-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    return (
        <Autocomplete
            onLoad={(auto) => setAutocomplete(auto)}
            onPlaceChanged={onPlaceChanged}
            fields={['address_components', 'geometry', 'formatted_address', 'place_id']}
        >
            <Input
                id={id}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
                disabled={disabled}
                className={className}
            />
        </Autocomplete>
    )
}
