import dns from 'dns/promises';

// Static fallback list.
let localBlacklist = new Set([
  'yopmail.com', 'tempmail.com', 'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'temp-mail.org'
]);

let lastFetchTime = 0;
const FETCH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getDisposableDomains(): Promise<Set<string>> {
  const now = Date.now();
  if (now - lastFetchTime > FETCH_INTERVAL_MS) {
    try {
      const response = await fetch('https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf');
      if (response.ok) {
        const text = await response.text();
        const domains = text.split('\n').map(d => d.trim()).filter(d => d && !d.startsWith('//'));
        if (domains.length > 0) {
          localBlacklist = new Set(domains);
          lastFetchTime = now;
          console.log(`[Email-Verify] Loaded ${domains.length} disposable domains.`);
        }
      }
    } catch (e) {
      console.warn("[Email-Verify] Failed to fetch latest disposable domains list, using fallback.", e);
    }
  }
  return localBlacklist;
}

export async function verifyEmailForFree(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // Check 1: Community Blacklist Check
  const blacklist = await getDisposableDomains();
  if (blacklist.has(domain)) return false;

  try {
    // Check 2: Live MX Record Lookup (Completely Free DNS Query)
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) return false; // No mail server = fake email

    // Check if the actual mail servers point to known temp infrastructures
    const hasTempMx = mxRecords.some(record => 
      record.exchange.includes('mailinator') || 
      record.exchange.includes('temp-mail') || 
      record.exchange.includes('yopmail') ||
      record.exchange.includes('guerrillamail')
    );
    if (hasTempMx) return false;
  } catch (error) {
    return false; // DNS lookup failed, invalid domain
  }

  return true; // Email passed domain & server verification
}

export function normalizeEmail(email: string): string {
  let [local, domain] = email.toLowerCase().split('@');
  if (!domain) return email;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove everything after first '+'
    local = local.split('+')[0];
    // Remove all dots
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }

  return `${local}@${domain}`;
}
