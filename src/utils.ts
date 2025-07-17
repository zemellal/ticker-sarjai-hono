import type { SEC_DATA_RESPONSE } from "./sec-fetch";

export function buildTickerToCompanyMap(
	secCompaniesList: SEC_DATA_RESPONSE,
): Map<string, Record<string, string | number>> {
	const { fields, data } = secCompaniesList;
	const map = new Map<string, Record<string, string | number>>();
	for (const row of data) {
		const obj = Object.fromEntries(fields.map((field, i) => [field, row[i]]));
		if (typeof obj.ticker === "string" && obj.ticker) {
			map.set(obj.ticker.toUpperCase(), obj);
		}
	}
	return map;
}
