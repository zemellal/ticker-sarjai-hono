import { Hono } from "hono";
import { cache } from "hono/cache";
import {
	getAllTickerQueryCounts,
	getCompanies,
	getCompanyByTicker,
	incrementTickerCount,
} from "./companies";
import { SEC_COMPANY_CACHE_DURATION } from "./consts";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => {
	return c.text("Hello SEC Ticker from Hono backend!");
});

app.get(
	"/companies/query-counts",
	cache({
		cacheName: "ticker-query-counts",
		cacheControl: "max-age=5",
	}),
	async (c) => {
		const counts = await getAllTickerQueryCounts(c.env);
		return c.json(counts);
	},
);

app.get(
	"/companies",
	cache({
		cacheName: "sec-companies",
		cacheControl: `max-age=${SEC_COMPANY_CACHE_DURATION}`,
	}),
	async (c) => {
		try {
			const secCompaniesList = await getCompanies(c.env);
			return c.json(secCompaniesList);
		} catch (error) {
			return c.text(`Error: ${(error as Error).message}`, 500);
		}
	},
);

app.get("/companies/:ticker", async (c) => {
	const ticker = c.req.param("ticker").toUpperCase();
	try {
		const companyObj = await getCompanyByTicker(c.env, ticker);

		if (!companyObj) {
			return c.text("Not found", 404);
		}

		await incrementTickerCount(c.env, ticker);

		return c.json(companyObj);
	} catch (error) {
		return c.text(`Error: ${(error as Error).message}`, 500);
	}
});

export default app;
