// Validate that an email address is plausible — both syntactically and
// at the DNS level. We can't confirm an email actually *receives* mail
// without sending one, but checking that its domain has MX records
// catches obvious garbage like "abc@asdfghjkl.qqq" that passes regex.
import { promises as dns } from 'node:dns';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Tiny in-memory cache so repeated signups from the same domain don't
// hit DNS every time. Lives only for the process — fine on the free tier
// and we don't need persistence here.
const _cache = new Map();          // domain → { ok, expiresAt }
const TTL_MS = 10 * 60 * 1000;     // 10 minutes

export function emailFormatOk(email) {
  return EMAIL_RE.test(String(email || ''));
}

export async function domainHasMail(email) {
  const at = String(email).lastIndexOf('@');
  if (at < 1) return false;
  const domain = email.slice(at + 1).toLowerCase();

  const hit = _cache.get(domain);
  if (hit && hit.expiresAt > Date.now()) return hit.ok;

  // Fail-OPEN policy: only reject when DNS conclusively says the domain
  // does not exist (NOTFOUND / NODATA). Any other error — the DNS server
  // is unreachable, times out, refuses the query, etc. — means we cannot
  // tell, so we let the signup through. Blocking real users due to an
  // infra issue is worse than admitting the occasional bogus email.
  const isNoSuchDomain = (e) => e?.code === 'ENOTFOUND' || e?.code === 'ENODATA';

  let ok = true;          // default to allow on inconclusive answers
  try {
    const mx = await dns.resolveMx(domain);
    if (Array.isArray(mx) && mx.length > 0) ok = true;
    else throw Object.assign(new Error('no MX'), { code: 'ENODATA' });
  } catch (mxErr) {
    if (isNoSuchDomain(mxErr)) {
      // Some domains accept mail on the A record (RFC 5321 fallback).
      try {
        const a = await dns.resolve(domain);
        ok = Array.isArray(a) && a.length > 0;
      } catch (aErr) {
        ok = !isNoSuchDomain(aErr);   // only reject if A also says no such domain
      }
    } else {
      // network/transport problem — don't punish the user
      ok = true;
    }
  }

  _cache.set(domain, { ok, expiresAt: Date.now() + TTL_MS });
  return ok;
}
