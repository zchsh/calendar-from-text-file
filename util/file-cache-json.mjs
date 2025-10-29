import fs from "fs";
import path from "path";

const CWD = process.cwd();
const CACHE_DIR = path.join(CWD, "cache");

// Ensure the cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
	fs.mkdirSync(CACHE_DIR);
}

export async function fileCacheJson(asyncFn, cacheKey) {
	const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
	if (fs.existsSync(cacheFile)) {
		// hit the cache
		return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
	} else {
		// calculate the result
		const result = await asyncFn();
		// if the result does not have "error", write it
		if (!result.error) {
			fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
		}
		return result;
	}
}
