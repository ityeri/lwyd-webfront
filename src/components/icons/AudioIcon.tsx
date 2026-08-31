type AudioIconParams = {
    fillColor: string
}

export default function AudioIcon({ fillColor }: AudioIconParams) {
    return (
        <svg
            className="size-full min-w-0 min-h-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M11 5 6 9H2v6h4l5 4V5Z" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}
