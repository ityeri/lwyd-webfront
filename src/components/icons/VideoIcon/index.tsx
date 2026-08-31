type VideoIconParams = {
    fillColor: string
}

export default function VideoIcon({ fillColor }: VideoIconParams) {
    return (
        <svg
            className="size-full min-w-0 min-h-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="m22 8-6 4 6 4V8Z" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="2" y="6" width="14" height="12" rx="2" stroke={fillColor} strokeWidth="1.5" />
        </svg>
    )
}
