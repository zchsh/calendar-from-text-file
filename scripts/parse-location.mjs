import { parseLatLon } from "./parse-lat-lon.mjs";
import { nomatimSearch } from "./nomatin-search.mjs";

const LOC_REGEX = /Location is ([^.]*)./;
const GEO_REGEX = /Geo is ([-\d\.]+):([-\d\.]+)./;

/**
 * TODO: write description
 *
 * @param {*} descriptionString
 * @returns
 */
export async function parseLocation(descriptionString) {
	// Attempt to parse latitude and longitude from the description
	const geoAuthored = parseLatLon(descriptionString, GEO_REGEX);
	// Attempt to parse a location label from the description
	const locationLabel = parseLocationLabel(descriptionString, LOC_REGEX);
	// Keep track of which of geo and location we have
	const hasGeoAuthored = isValidGeo(geoAuthored);
	const hasLocation = typeof locationLabel === "string" && locationLabel !== "";
	/**
	 * If we have a location but no manually authored GEO lat & lon,
	 * search OpenStreetMaps data using nomatim.org to try to find lat & lon
	 */
	let geoInferred = null;
	if (hasLocation && !hasGeoAuthored) {
		/**
		 * If we have a location but no geo, could be neat to search the
		 * location on nomatim.org to see if we can get geo.
		 *
		 * Note that we cache the results in local .json files, and we
		 * strictly limit API calls to a maximum of 1 per second.
		 *
		 * API DOCS:
		 * https://nominatim.org/release-docs/develop/api/Search/
		 *
		 * EXAMPLE:
		 * https://nominatim.openstreetmap.org/search?q=Artisan+Bakery,+London,+Ontario&format=jsonv2
		 */
		const searchResult = await nomatimSearch(locationLabel);
		if (searchResult.length > 0) {
			const { lat: latString, lon: lonString } = searchResult[0];
			geoInferred = { lat: parseFloat(latString), lon: parseFloat(lonString) };
		}
	}
	const hasGeoInferred = isValidGeo(geoInferred);
	// Determine which geo value to use
	const geo = hasGeoAuthored
		? geoAuthored
		: hasGeoInferred
		? geoInferred
		: undefined;
	/**
	 * NOTE: Apple Calendar REQUIRES a location property, otherwise it
	 * won't even display its own custom X-APPLE-STRUCTURED-LOCATION data.
	 * So, we add a fallback location if `lat` and `lon` are specified.
	 */
	const location = hasLocation
		? locationLabel
		: typeof geo !== "undefined"
		? "Event location"
		: undefined;
	// Return the parsed geo and location
	return { geo, location };
}

/**
 * TODO: write description
 *
 * @param {*} latLonObj
 * @returns
 */
function isValidGeo(latLonObj) {
	if (!latLonObj || typeof latLonObj !== "object") {
		return false;
	}
	const { lat, lon } = latLonObj;
	return Boolean(lat && lon && !isNaN(lat) && !isNaN(lon));
}

/**
 * TODO: write description
 *
 * @param {*} inputString
 * @param {*} labelRegex
 * @returns
 */
function parseLocationLabel(inputString, labelRegex) {
	const labelMatch = inputString.match(labelRegex);
	if (!labelMatch) {
		return null;
	}
	const [_labelMatchFull, labelString] = labelMatch;
	return labelString;
}
