type VideoSectionProps = {
  videoUrl: string;
};

export default function VideoSection({ videoUrl }: VideoSectionProps) {

  return (
    <div className="flex flex-col items-center bg-[url('/images/backgrounds/black-mint-bg.png')] bg-cover bg-center bg-fixed py-10">
        <div className="w-full  overflow-hidden lg:w-[1140px] lg:min-h-[300px] px-3 lg:px-0">
            <iframe
                className="w-full h-full rounded-2xl aspect-video shadow-lg"
                src={videoUrl}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
      </div>
    </div>
  );
}
