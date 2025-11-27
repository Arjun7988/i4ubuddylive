import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { GradientButton } from '../GradientButton';

interface CouponCardProps {
  id: string;
  title: string;
  description?: string;
  discountValue: string;
  discountType: string;
  badgeText?: string;
  badgeColor?: string;
  expiresAt: string;
  couponCode?: string;
  buttonText: string;
  buttonAction: string;
  terms?: string;
  onAction: (couponId: string, action: string) => void;
}

export function CouponCard({
  id,
  title,
  description,
  discountValue,
  discountType,
  badgeText,
  badgeColor = '#ec4899',
  expiresAt,
  couponCode,
  buttonText,
  buttonAction,
  terms,
  onAction,
}: CouponCardProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const handleButtonClick = async () => {
    if (buttonAction === 'show_code') {
      if (!showCode) {
        setShowCode(true);
      } else if (couponCode) {
        await navigator.clipboard.writeText(couponCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      onAction(id, buttonAction);
    }
  };

  const getBadgeStyles = () => {
    const baseStyles = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase';

    switch (badgeText) {
      case 'ON THE RISE':
        return `${baseStyles} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      case 'CODE':
        return `${baseStyles} bg-pink-500/20 text-pink-400 border border-pink-500/30`;
      case 'DEAL':
        return `${baseStyles} bg-pink-500/20 text-pink-400 border border-pink-500/30`;
      default:
        return `${baseStyles} bg-primary-500/20 text-primary-400 border border-primary-500/30`;
    }
  };

  return (
    <div className="bg-surface/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 hover:border-primary-500/30 transition-all">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-shrink-0 text-center min-w-[100px]">
          <div className="text-4xl font-bold text-white mb-1">{discountValue}</div>
          <div className="text-lg font-semibold text-gray-400">{discountType}</div>
          {description && (
            <div className="text-xs text-gray-500 mt-1">{description}</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {badgeText && (
            <div className="mb-3">
              <span className={getBadgeStyles()}>
                {badgeText === 'CODE' && <span className="text-lg">🏷️</span>}
                {badgeText === 'DEAL' && <span className="text-lg">🎯</span>}
                {badgeText === 'ON THE RISE' && <span className="text-lg">📈</span>}
                {badgeText}
              </span>
            </div>
          )}

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

          {expiresAt && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Clock className="w-4 h-4" />
              <span>Until {formatExpiryDate(expiresAt)}</span>
            </div>
          )}

          {showCode && couponCode && (
            <div className="mb-4 p-3 bg-dark-200/50 rounded-lg border border-primary-500/30">
              <div className="text-xs text-gray-400 mb-1">Coupon Code:</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-mono font-bold text-primary-400">{couponCode}</div>
                {copied && (
                  <span className="flex items-center gap-1 text-sm text-green-400">
                    <Check className="w-4 h-4" />
                    Copied!
                  </span>
                )}
              </div>
            </div>
          )}

          {terms && (
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors mb-3"
            >
              <span>Terms</span>
              {showTerms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {showTerms && terms && (
            <div
              className="mb-4 p-4 bg-dark-200/30 rounded-lg text-sm text-gray-300 prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: terms }}
            />
          )}
        </div>

        <div className="flex-shrink-0">
          <GradientButton
            onClick={handleButtonClick}
            className="whitespace-nowrap flex items-center gap-2"
          >
            {showCode && buttonAction === 'show_code' ? (
              copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )
            ) : (
              buttonText
            )}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
