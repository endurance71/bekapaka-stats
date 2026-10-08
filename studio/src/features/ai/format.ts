import type { AiModel, AiProviderId } from '../../lib/types';

export const providerLabel: Record<AiProviderId, string> = {
  google: 'Google Gemini',
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI',
};
export const usd = (micros: number, digits = 3) => `${(micros / 1e6).toFixed(digits).replace('.', ',')} USD`;
export const price = (n: number) => `$${String(n).replace('.', ',')}`;
/** Price per 1M tokens: input / output (image models: per 2K image). */
export const priceLabel = (m: AiModel) =>
  m.kind === 'image' && m.perImage2K
    ? `${price(m.perImage2K)} za obraz`
    : `${price(m.input)} / ${price(m.output)} za 1M`;
