type YouTubeVideoParams = {
    videoId: string
}

export default function YouTubeVideo({videoId}: YouTubeVideoParams) {
    return (
        <iframe
            className="size-full" src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player" frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
        />
    )
}