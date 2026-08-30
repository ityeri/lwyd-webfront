type SearchIconParms = {
    fillColor: string
}

export default function SearchIcon({ fillColor }: SearchIconParms) {
    return (
        <svg
            className="size-full min-w-0 min-h-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="11" cy="11" r="7" stroke={fillColor} strokeWidth="1.5" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}
