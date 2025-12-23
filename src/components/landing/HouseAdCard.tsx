interface HouseAdCardProps {
  imageUrl: string;
  title: string;
  description: string;
  ctaLabel: string;
  link?: string;
  onClick?: () => void;
}

export function HouseAdCard({ imageUrl, title, description, ctaLabel, link, onClick }: HouseAdCardProps) {
  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer hover:shadow-glow transition-all duration-300 hover:scale-105"
      onClick={onClick}
    >
      <div className="aspect-[4/2.8] bg-gradient-to-br from-primary-500/20 to-secondary-500/20 relative overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white text-sm font-bold mb-1 line-clamp-2">{title}</h3>
          <p className="text-white/80 text-xs line-clamp-1">{description}</p>
        </div>
      </div>

      <div className="absolute top-2 right-2">
        <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs font-medium">
          Ad
        </span>
      </div>
    </div>
  );
}
