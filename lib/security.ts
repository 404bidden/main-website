/**
 * Security helpers for validating URLs and preventing server-side request forgery (SSRF)
 */

/**
 * Validates a URL to prevent SSRF attacks by checking against:
 * - Localhost and loopback addresses
 * - Private IP ranges (IPv4)
 * - Link-local addresses
 * - Carrier-grade NAT addresses
 * - Private/local IPv6 addresses
 * - Internal DNS names
 * - Cloud metadata services
 * - Sensitive ports
 * - Sensitive endpoints
 *
 * @param url The URL to validate
 * @returns An object with isValid flag and error message if invalid
 */
export function validateUrlSecurity(url: string): {
    isValid: boolean;
    error?: string;
} {
    try {
        const targetUrl = new URL(url);

        // Security checks - Block localhost, private IPs, etc.
        if (
            // Block localhost and loopback addresses
            targetUrl.hostname === "localhost" ||
            targetUrl.hostname === "127.0.0.1" ||
            /^127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(
                targetUrl.hostname,
            ) ||
            targetUrl.hostname === "[::1]" ||
            // Block private IP ranges (IPv4)
            /^10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(
                targetUrl.hostname,
            ) ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\.([0-9]{1,3})\.([0-9]{1,3})$/.test(
                targetUrl.hostname,
            ) ||
            /^192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/.test(targetUrl.hostname) ||
            // Block link-local addresses
            /^169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/.test(targetUrl.hostname) ||
            // Block carrier-grade NAT addresses
            /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\.([0-9]{1,3})\.([0-9]{1,3})$/.test(
                targetUrl.hostname,
            ) ||
            // Block private/local IPv6 addresses
            /^fc00:/.test(targetUrl.hostname) ||
            /^fd[0-9a-f]{2}:/.test(targetUrl.hostname) ||
            /^fe80:/.test(targetUrl.hostname) ||
            // Block internal DNS names
            /\.(local|internal|private|localhost|corp|home|lan)$/.test(
                targetUrl.hostname,
            ) ||
            // Block cloud metadata services
            /(^|\.)metadata\.(aws|google|azure|do)\./.test(
                targetUrl.hostname,
            ) ||
            targetUrl.hostname === "169.254.169.254" ||
            // Block sensitive ports
            [
                21, 22, 23, 25, 80, 111, 135, 137, 139, 389, 445, 1433, 1521,
                3306, 3389, 5432, 5900, 6379, 9200, 11211, 27017,
            ].includes(Number(targetUrl.port)) ||
            // Block requests to sensitive endpoints
            /\.well-known\/(webfinger|host-meta)/.test(targetUrl.pathname) ||
            targetUrl.pathname.includes("/.discovery")
        ) {
            return {
                isValid: false,
                error: "Access denied for security reasons: cannot use local or private URLs",
            };
        }

        // URL passed all security checks
        return { isValid: true };
    } catch (error) {
        return {
            isValid: false,
            error: `Invalid URL: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Filters out sensitive headers that shouldn't be forwarded in requests
 *
 * @param headers The headers object to filter
 * @returns A new headers object with sensitive headers removed
 */
export function filterSensitiveHeaders(
    headers: Record<string, string>,
): Record<string, string> {
    const filteredHeaders: Record<string, string> = {};
    const forbiddenHeaders = [
        // Authentication headers
        "authorization",
        "proxy-authorization",
        "cookie",
        "set-cookie",
        "x-csrf-token",

        // Browser-specific authentication
        "www-authenticate",
        "proxy-authenticate",

        // Tracking/identity headers
        "x-forwarded-for",
        "x-real-ip",
        "forwarded",
        "x-forwarded-host",
        "x-forwarded-proto",
        "x-forwarded-ssl",
        "x-correlation-id",
        "fastly-client-ip",
        "true-client-ip",

        // Security headers that should not be forwarded
        "sec-",
        "proxy-",
        "cf-",
        "x-csrf",
        "x-xsrf",
        "strict-transport-security",
        "content-security-policy",
        "x-content-security-policy",
        "x-webkit-csp",

        // Internal/sensitive headers
        "x-api-key",
        "x-internal",
        "x-secret",
        "x-amz-security-token",
        "api-key",
        "x-functions-key",
        "x-goog-authenticated-user-email",
        "x-aws-",
        "x-amz-",
        "x-azure-",
        "x-gcp-",
        "x-heroku-",
        "x-vercel-",

        // Debug and instrumentation headers
        "x-debug",
        "x-runtime",
        "x-request-id",
        "x-trace",
    ];

    for (const key in headers) {
        const lowerKey = key.toLowerCase();

        // Skip headers that match forbidden prefixes
        if (
            forbiddenHeaders.some((forbidden) =>
                forbidden.endsWith("-")
                    ? lowerKey.startsWith(forbidden)
                    : lowerKey === forbidden,
            )
        ) {
            continue;
        }

        filteredHeaders[key] = headers[key];
    }

    return filteredHeaders;
}
