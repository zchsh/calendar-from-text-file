import { fileCacheJson } from "../util/file-cache-json.mjs";
import { slugify } from "../util/slugify.mjs";
import { throttlePromise } from "../util/throttle-promise.mjs";

/**
 * TODO: write description
 *
 * @param {*} queryString
 * @returns
 */
async function nomatimSearchFetch(queryString) {
	const queryUrl = new URL("https://nominatim.openstreetmap.org/search");
	queryUrl.searchParams.set("q", queryString);
	queryUrl.searchParams.set("format", "jsonv2");
	const response = await fetch(queryUrl, {
		headers: { "User-Agent": "zchsh" },
	});
	return await response.json();
}

const nomatimSearchThrottled = throttlePromise(nomatimSearchFetch, 1000);

/**
 * TODO: write description
 *
 * TODO: cache responses
 * TODO: strict limit to one request per second
 *
 * @param {*} queryString
 */
export async function nomatimSearch(queryString) {
	const cacheKey = slugify(queryString);
	return await fileCacheJson(
		nomatimSearchThrottled.bind(null, queryString),
		cacheKey
	);
}
