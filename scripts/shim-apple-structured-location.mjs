/**
 * Given an iCalendar file string, find any events that have a `GEO:` property,
 * parse the latitude and longitude from the `GEO` property, and
 * Return an iCalendar file string with an `X-APPLE-STRUCTURED-LOCATION`
 * property added to all events that have a valid `GEO` property.
 *
 * Note that we attempt to parse the `LOCATION` property as well, to use
 * as a label for the structured location.
 *
 * TODO: I'm taking a very brittle approach here of expecting the `LOCATION`
 * TODO: property to ALWAYS be on the line immediately after the `GEO` property.
 * TODO: Obviously this is not a safe assumption at all, I can only make this
 * TODO: assumption because I'm definitely generating my `.ics` this way...
 * TODO: Ideally, would search lines adjacent to `GEO` but within the same
 * TODO: `VEVENT` for any line starting with `LOCATION`... but for now I'm
 * TODO: gonna do it the easy and breakable way.
 *
 * @param {string} icsFileString
 * @returns {string}
 */
export function shimAppleStructuredLocation(icsFileString) {
	// Initialize an array of output lines
	const outputLines = [];
	// Work through the input lines
	const inputLines = icsFileString.split("\n");
	for (let i = 0; i < inputLines.length; i++) {
		/**
		 * Try parsing a structured location from the current inputLine.
		 * For a success case, inputLine have a valid GEO property.
		 * We also include the next line in case it starts with LOCATION, in which
		 * case we use LOCATION as a label.
		 */
		const inputLine = inputLines[i];
		const nextLine = i + 1 < inputLines.length ? inputLines[i + 1] : null;
		const structuredLocationLine = tryParseStructuredLocation(
			inputLine,
			nextLine
		);
		// If we parsed a structured location, add it, it'll be before the GEO line
		if (structuredLocationLine) {
			outputLines.push(structuredLocationLine);
		}
		// Regardless of anything else, retain all input lines in the output
		outputLines.push(inputLine);
	}
	// Join and return the output lines
	return outputLines.join("\n");
}

function tryParseStructuredLocation(inputLine, nextLine) {
	// If the input line does not start with `GEO:`, exit early
	if (!inputLine.startsWith("GEO:")) {
		return null;
	}
	// Attempt to parse latitude and longitude from the `GEO:` line
	const geoLineRegex = /^GEO:([-\d\.]+);([-\d\.]+)/;
	const geoMatch = inputLine.match(geoLineRegex);
	if (!geoMatch) {
		return null;
	}
	const [_geoMatchFull, latString, lonString] = geoMatch;
	const lat = parseFloat(latString);
	const lon = parseFloat(lonString);
	if (isNaN(lat) || isNaN(lon)) {
		return null;
	}
	// Attempt to parse a label from the next line, expected to be `LOCATION`
	let location;
	if (nextLine && nextLine.startsWith("LOCATION:")) {
		const locationLineRegex = /^LOCATION:(.*)/;
		const locationMatch = nextLine.match(locationLineRegex);
		if (locationMatch) {
			const [_locMatchFull, locationString] = locationMatch;
			location = locationString;
		}
	}
	// Format the lat, lon, and location as an `APPLE-STRUCTURED-LOCATION`
	return `X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=49;X-TITLE=${location}:geo:${lat},${lon}`;
}
