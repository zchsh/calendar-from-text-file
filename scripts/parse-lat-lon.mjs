export function parseLatLon(inputString, latLonRegex) {
	const latLonMatch = inputString.match(latLonRegex);
	if (!latLonMatch) {
		return { lat: null, lon: null };
	}
	const [_latLonMatchFull, latString, lonString] = latLonMatch;
	const lat = parseFloat(latString);
	const lon = parseFloat(lonString);
	if (isNaN(lat) || isNaN(lon)) {
		return { lat: null, lon: null };
	}
	return { lat, lon };
}
