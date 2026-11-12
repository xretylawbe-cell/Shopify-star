const FIELDS = { store_name: 80, tagline: 500, whatsapp_number: 20, promo_message: 200, hero_text: 1000, banner_url: 500, about: 5000, contact: 2000, delivery_info: 3000, policies: 8000, footer: 1000, social_facebook: 300, social_instagram: 300, social_tiktok: 300 };
const URLS = ['banner_url', 'social_facebook', 'social_instagram', 'social_tiktok'];
function clean(k, v) {
  v = String(v ?? '').trim();
  if (v.length > FIELDS[k]) return { error: `${k} is too long (max ${FIELDS[k]} characters)` };
  if (k === 'whatsapp_number') { v = v.replace(/[\s+()-]/g, ''); if (v && !/^\d{8,15}$/.test(v)) return { error: 'WhatsApp number: digits only with country code, e.g. 2348012345678' }; }
  if (URLS.includes(k) && v && !/^(https:\/\/|\/uploads\/)/.test(v)) return { error: `${k} must start with https://` };
  return { value: v };
}
module.exports = { FIELDS, clean };
