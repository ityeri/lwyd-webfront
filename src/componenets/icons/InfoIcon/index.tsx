type InfoIconParms = {
    fillColor: string
}

export default function InfoIcon({ fillColor }: InfoIconParms) {
    return (
        <svg
            className="size-full min-w-0 min-h-0"
            viewBox="10 10 43 43"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M28 28.2365L28.164 28.1549C28.6769 27.8936 29.2525 27.7877 29.8227 27.8497C30.3928 27.9116 30.9336 28.1389 31.381 28.5045C31.8284 28.8702 32.1636 29.3589 32.3471 29.9129C32.5305 30.4668 32.5544 31.0627 32.416 31.6301L29.584 43.1977C29.4446 43.7653 29.4678 44.3618 29.6508 44.9165C29.8338 45.4711 30.169 45.9606 30.6165 46.3268C31.0641 46.693 31.6053 46.9207 32.176 46.9827C32.7466 47.0448 33.3227 46.9387 33.836 46.6769L34 46.5913M31 16H31.032V16.0326H31V16Z"
                stroke={fillColor}
                stroke-width="6"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    )
}
