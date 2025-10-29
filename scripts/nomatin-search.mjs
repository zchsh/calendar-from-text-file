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
	const result = await response.json();
	// Log out that we've done a new search
	if (result.length > 0) {
		console.log(`🗺️ Nominatim search for ${queryString} yielded:`);
		console.log(`  ${result[0].display_name}.`);
	} else {
		console.log(
			`❓ Nominatim search for ${queryString} did not yield results.`
		);
	}
	return result;
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
