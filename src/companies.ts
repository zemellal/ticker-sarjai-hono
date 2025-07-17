import * as z from "zod/mini";
import {
	KV_KEY_COMPANIES,
	KV_KEY_COMPANY,
	KV_KEY_TICKER_COUNT_PREFIX,
	SEC_COMPANY_CACHE_DURATION,
} from "./consts";
import {
	fetchSECCompanies,
	type SEC_DATA_RESPONSE,
	SECDataResponseSchema,
} from "./sec-fetch";
import { buildTickerToCompanyMap } from "./utils";

export const CompanySchema = z.object({
	cik: z.number(),
	name: z.string(),
	ticker: z.string(),
	exchange: z.string(),
});

export type CompanyType = z.infer<typeof CompanySchema>;

export async function getCompanies(env: {
	SEC_KV: KVNamespace;
}): Promise<SEC_DATA_RESPONSE> {
	// Try to get from KV
	const cached = await env.SEC_KV.get(KV_KEY_COMPANIES);
	if (cached) {
		console.log("companies from kv cache");
		try {
			return SECDataResponseSchema.parse(JSON.parse(cached));
		} catch (err) {
			console.error("Failed to parse cached SEC data:", err);
			// Proceed to fetch fresh data
		}
	}
	// Fetch from SEC
	const fresh = await fetchSECCompanies();
	// Store in KV with expiration
	await env.SEC_KV.put(KV_KEY_COMPANIES, JSON.stringify(fresh), {
		expirationTtl: SEC_COMPANY_CACHE_DURATION,
	});
	return fresh;
}

export async function getCompanyByTicker(
	env: { SEC_KV: KVNamespace },
	ticker: string,
): Promise<CompanyType | null> {
	const kvKey = `${KV_KEY_COMPANY}${ticker}`;
	const companyStr = await env.SEC_KV.get(kvKey);

	if (companyStr) {
		return CompanySchema.parse(JSON.parse(companyStr));
	}

	// Fetch SEC companies list and build ticker map
	const secCompaniesList = await getCompanies(env);
	const tickerMap = buildTickerToCompanyMap(secCompaniesList);

	const companyObj = tickerMap.get(ticker);
	if (!companyObj) {
		return null;
	}

	// Store just this company in KV for future requests
	await env.SEC_KV.put(kvKey, JSON.stringify(companyObj), {
		expirationTtl: SEC_COMPANY_CACHE_DURATION,
	});

	return CompanySchema.parse(companyObj);
}

export async function incrementTickerCount(
	env: { SEC_KV: KVNamespace },
	ticker: string,
): Promise<number> {
	const kvKey = `${KV_KEY_TICKER_COUNT_PREFIX}${ticker}`;
	const currentCountStr = await env.SEC_KV.get(kvKey);
	const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
	await env.SEC_KV.put(kvKey, (currentCount + 1).toString());
	return currentCount + 1;
}

export async function getAllTickerQueryCounts(env: {
	SEC_KV: KVNamespace;
}): Promise<Record<string, number>> {
	const list = await env.SEC_KV.list({ prefix: KV_KEY_TICKER_COUNT_PREFIX });
	const counts: Record<string, number> = {};

	// for lots of counts, we should consider a different approach to storing indidivual KVs per ticker
	for (const { name } of list.keys) {
		const ticker = name.replace(KV_KEY_TICKER_COUNT_PREFIX, "");
		const countStr = await env.SEC_KV.get(name);
		counts[ticker] = countStr ? parseInt(countStr, 10) : 0;
	}
	return counts;
}
