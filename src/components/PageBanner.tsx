import { ReactNode, LucideIcon } from 'lucide-react';

interface PageBannerProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient?: 'hero' | 'primary' | 'magenta' | 'orange' | 'cyan' | 'vibrant' | 'sunset' | 'warm' | 'coral' | 'fire' | 'rainbow';
  pattern?: 'dots' | 'grid' | 'waves' | 'none';
  action?: {
    label: string;
    onClick: () => void;
  };
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: LucideIcon;
  }>;
}

export function PageBanner({
  title,
  description,
  icon: Icon,
  gradient = 'hero',
  pattern = 'dots',
  action,
  stats,
}: PageBannerProps) {
  const gradientClasses = {
    hero: 'bg-gradient-hero',
    primary: 'bg-gradient-primary',
    magenta: 'bg-gradient-magenta',
    orange: 'bg-gradient-orange',
    cyan: 'bg-gradient-cyan',
    vibrant: 'bg-gradient-vibrant',
    sunset: 'bg-gradient-sunset',
    warm: 'bg-gradient-warm',
    coral: 'bg-gradient-coral',
    fire: 'bg-gradient-fire',
    rainbow: 'bg-gradient-rainbow',
  };

  const patternStyles = {
    dots: {
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    },
    grid: {
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      backgroundSize: '30px 30px',
    },
    waves: {
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 30c10 0 10-10 20-10s10 10 20 10 10-10 20-10 10 10 20 10v10H0z\' fill=\'%23ffffff\' fill-opacity=\'0.05\'/%3E%3C/svg%3E")',
    },
    none: {},
  };

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8 shadow-glow-multi">
      <div
        className={`relative ${gradientClasses[gradient]} p-8 md:p-12`}
        style={pattern !== 'none' ? patternStyles[pattern] : {}}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0 animate-pulse-slow">
                <Icon className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3 tracking-tight">
                  {title}
                </h1>
                <p className="text-lg text-white/90 max-w-2xl leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {action && (
              <button
                onClick={action.onClick}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/30 whitespace-nowrap"
              >
                {action.label}
              </button>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
              {stats.map((stat, index) => (
                <div key={index} className="text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                    {stat.icon && <stat.icon className="w-5 h-5 text-white/80" />}
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
