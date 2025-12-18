'use client';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
}

export function YouTubePlayer({ videoId, title = 'YouTube Video' }: YouTubePlayerProps) {
  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
        Keine Video-ID angegeben
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
