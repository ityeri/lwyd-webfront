type InfoIconParms = {
    fillColor: string
}

export default function InfoIcon({ fillColor }: InfoIconParms) {
    return (
        <svg
            className="size-full min-w-0 min-h-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="12" cy="12" r="10" stroke={fillColor} strokeWidth="1.5" />
            <line x1="12" y1="16" x2="12" y2="12" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="8" x2="12.01" y2="8" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}
