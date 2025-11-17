'use client'

import * as React from 'react'
import { INDUSTRY_IMAGES, toSlug, imageUrl } from '@/lib/industryImages'

type Props = {
    
    allIndustries: string[]
    defaultIndustry?: string | null
    defaultImageKey?: string | null

}

export default function IndustryImagePicker({ allIndustries, defaultIndustry, defaultImageKey }: Props) {

    const [industry, setIndustry] = React.useState<string>(defaultIndustry ?? '')
    const [selectedKey, setSelectedKey] = React.useState<string | undefined>(defaultImageKey ?? undefined)

    const slug = toSlug(industry || '')

    const keys = slug ? (INDUSTRY_IMAGES[slug] ?? []) : []

    // if industry changes adn current key doesn't belong, clear selection

    React.useEffect(() => {
        if (selectedKey && (!slug || !keys.includes(selectedKey))){
            setSelectedKey(undefined)
        }
    }, [slug])

    return (
    <div className="space-y-4">
      {/* Industry select (this will be posted as part of the form) */}
      <label className="block pt-4">
        <span>Industry</span>
        <select
          name="industry"
          required
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
        >
          <option value="" disabled>Choose an industry…</option>
          {allIndustries.map((label) => (
            <option key={label} value={label}>{label}</option>
          ))}
        </select>
      </label>

      {/* Image grid (shows only after industry chosen) */}
      {slug && (
        <div className="pt-2">
          <div className="mb-2 text-sm text-neutral-600">Choose a cover image</div>
          {keys.length ? (
            <div className="grid grid-cols-2 gap-3">
              {keys.map((key) => {
                const checked = selectedKey === key
                return (
                  <label
                    key={key}
                    className={`relative overflow-hidden rounded border hover:shadow-sm transition
                                ${checked ? 'ring-2 ring-[#9ed3c3] border-transparent' : 'border-neutral-200'}`}
                  >
                    {/* Radio that will submit with the form */}
                    <input
                      type="radio"
                      name="listing_image_choice"
                      value={key}
                      className="sr-only"
                      checked={checked || false}
                      onChange={() => setSelectedKey(key)}
                    />
                    <img src={imageUrl(key)} alt="" className="h-40 w-full object-cover" />
                    <div className={`absolute inset-0 pointer-events-none ${checked ? 'ring-inset ring-2 ring-[#7fb8a9]' : ''}`} />
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-neutral-500">No catalog images defined for this industry yet.</div>
          )}
        </div>
      )}
    </div>
  )
}