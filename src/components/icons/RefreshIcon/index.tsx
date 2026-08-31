type RefreshIconParams = {
    fillColor: string
}

export default function RefreshIcon({ fillColor }: RefreshIconParams) {
    return (
        <svg
            className="size-full min-w-0 min-h-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M21 12a9 9 0 1 1-2.64-6.36"
                stroke={fillColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M21 3v6h-6"
                stroke={fillColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
