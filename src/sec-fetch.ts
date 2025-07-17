import * as z from "zod/mini";

const SEC_URL = "https://www.sec.gov/files/company_tickers_exchange.json";

export const SECDataResponseSchema = z.object({
	fields: z.array(z.string()),
	data: z.array(z.array(z.any())),
});

export type SEC_DATA_RESPONSE = z.infer<typeof SECDataResponseSchema>;

export async function fetchSECCompanies(): Promise<SEC_DATA_RESPONSE> {
	console.log("[external-fetch] fetching companies list from sec");

	const response = await fetch(SEC_URL, {
		headers: {
			"User-Agent": "John Doe (test@example.com)",
			Accept: "application/json",
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.statusText}`);
	}
	const json = await response.json();
	return SECDataResponseSchema.parse(json);
}
