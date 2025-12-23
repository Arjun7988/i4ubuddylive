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
    <div className="bg-surface/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden hover:border-primary-500/30 transition-all">
      {/* Mobile Layout (< 640px) */}
      <div className="block sm:hidden">
        <div className="bg-gradient-to-br from-primary-600/20 to-pink-600/20 p-6 border-b border-white/5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-white mb-1">{discountValue}</div>
              <div className="text-base font-semibold text-gray-300">{discountType}</div>
            </div>
            {badgeText && (
              <span className={getBadgeStyles()}>
                {badgeText === 'CODE' && <span className="text-base">🏷️</span>}
                {badgeText === 'DEAL' && <span className="text-base">🎯</span>}
                {badgeText === 'ON THE RISE' && <span className="text-base">📈</span>}
                {badgeText}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-white leading-snug">{title}</h3>
        </div>

        <div className="p-4 space-y-3">
          {expiresAt && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Until {formatExpiryDate(expiresAt)}</span>
            </div>
          )}

          {showCode && couponCode && (
            <div className="p-3 bg-dark-200/50 rounded-lg border border-primary-500/30">
              <div className="text-xs text-gray-400 mb-1">Coupon Code:</div>
              <div className="flex items-center gap-2">
                <div className="text-base font-mono font-bold text-primary-400">{couponCode}</div>
                {copied && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <Check className="w-3 h-3" />
                    Copied!
                  </span>
                )}
              </div>
            </div>
          )}

          {terms && (
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              <span>Terms</span>
              {showTerms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {showTerms && terms && (
            <div
              className="p-3 bg-dark-200/30 rounded-lg text-xs text-gray-300 prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: terms }}
            />
          )}

          <GradientButton
            onClick={handleButtonClick}
            className="w-full flex items-center justify-center gap-2 py-3"
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

      {/* Tablet Layout (640px - 1024px) */}
      <div className="hidden sm:block lg:hidden">
        <div className="flex flex-col">
          <div className="bg-gradient-to-br from-primary-600/20 to-pink-600/20 p-5 border-b border-white/5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold text-white">{discountValue}</div>
                <div className="text-base font-semibold text-gray-300">{discountType}</div>
              </div>
              {badgeText && (
                <span className={getBadgeStyles()}>
                  {badgeText === 'CODE' && <span className="text-base">🏷️</span>}
                  {badgeText === 'DEAL' && <span className="text-base">🎯</span>}
                  {badgeText === 'ON THE RISE' && <span className="text-base">📈</span>}
                  {badgeText}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white leading-snug">{title}</h3>
          </div>

          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              {expiresAt && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Until {formatExpiryDate(expiresAt)}</span>
                </div>
              )}

              <GradientButton
                onClick={handleButtonClick}
                className="flex items-center gap-2 px-6"
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

            {showCode && couponCode && (
              <div className="p-3 bg-dark-200/50 rounded-lg border border-primary-500/30">
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
                className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                <span>Terms</span>
                {showTerms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}

            {showTerms && terms && (
              <div
                className="p-4 bg-dark-200/30 rounded-lg text-sm text-gray-300 prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: terms }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout (>= 1024px) */}
      <div className="hidden lg:block p-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 text-center min-w-[120px] bg-gradient-to-br from-primary-600/20 to-pink-600/20 rounded-xl p-4 border border-white/5">
            <div className="text-5xl font-bold text-white mb-1">{discountValue}</div>
            <div className="text-base font-semibold text-gray-300">{discountType}</div>
          </div>

          <div className="flex-1 min-w-0">
            {badgeText && (
              <div className="mb-3">
                <span className={getBadgeStyles()}>
                  {badgeText === 'CODE' && <span className="text-base">🏷️</span>}
                  {badgeText === 'DEAL' && <span className="text-base">🎯</span>}
                  {badgeText === 'ON THE RISE' && <span className="text-base">📈</span>}
                  {badgeText}
                </span>
              </div>
            )}

            <h3 className="text-2xl font-bold text-white mb-3 leading-snug">{title}</h3>

            {expiresAt && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Clock className="w-4 h-4" />
                <span>Until {formatExpiryDate(expiresAt)}</span>
              </div>
            )}

            {showCode && couponCode && (
              <div className="mb-4 p-4 bg-dark-200/50 rounded-lg border border-primary-500/30">
                <div className="text-xs text-gray-400 mb-1">Coupon Code:</div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-mono font-bold text-primary-400">{couponCode}</div>
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
              className="whitespace-nowrap flex items-center gap-2 px-6 py-3"
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
    </div>
  );
}
