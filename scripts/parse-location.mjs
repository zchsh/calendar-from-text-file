import { parseLatLon } from "./parse-lat-lon.mjs";

const LOC_REGEX = /Location is ([^.]*)./;
const GEO_REGEX = /Geo is ([-\d\.]+):([-\d\.]+)./;

/**
 * TODO: write description
 *
 * @param {*} descriptionString
 * @returns
 */
export function parseLocation(descriptionString) {
	// Attempt to parse latitude and longitude from the description
	const { lat, lon } = parseLatLon(descriptionString, GEO_REGEX);
	// Attempt to parse a location from the description
	const locationLabel = parseLocationLabel(descriptionString, LOC_REGEX);
	// Return the parsed lat, lon, and label
	return { lat, lon, locationLabel };
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
