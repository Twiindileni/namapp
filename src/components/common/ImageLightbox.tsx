'use client'

import { useState } from 'react'

interface ImageLightboxProps {
	src: string
	alt?: string
	thumbClassName?: string
	imgClassName?: string
}

export default function ImageLightbox({ src, alt = '', thumbClassName = '', imgClassName = '' }: ImageLightboxProps) {
	const [open, setOpen] = useState(false)

	return (
		<>
			<button type="button" onClick={() => setOpen(true)} className={`block w-full focus:outline-none ${thumbClassName}`}>
				<img src={src} alt={alt} className={imgClassName} />
			</button>
			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
					<div className="relative max-h-full max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
						<button onClick={() => setOpen(false)} className="absolute -top-3 -right-3 z-10 rounded-full bg-white text-gray-700 px-2 py-1 shadow">✕</button>
						<img src={src} alt={alt} className="w-full h-auto max-h-[85vh] object-contain rounded-md shadow-lg bg-white" />
					</div>
				</div>
			)}
		</>
	)
}