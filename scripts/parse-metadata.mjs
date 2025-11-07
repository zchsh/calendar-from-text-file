import { getRegexMatch } from "../util/get-regex-match.mjs";

/**
 * URL is <https://www.lpl.ca/events/glass-room-critical-tech-intervention-35>. URL label is Register. Description is A public exhibition that provides an interactive way for people to investigate the social impacts of technologies like Artificial Intelligence and social media platforms, and explore practical solutions to mitigate these impacts.
 */

const URL_REGEX = /URL is <([^>]*)\>/;
const URL_LABEL_REGEX = /URL label is ([^.]*)\.?/;
const DESCRIPTION_REGEX = /Description is `([^`]*\.?)`/;
const HOST_REGEX = /Hosted by ([^.]*)\.?/;

/**
 * TODO: write description
 *
 * @param {*} eventDataString
 * @returns
 */
export function parseMetadata(eventDataString) {
	// Attempt to parse a location label from the description
	const url = getRegexMatch(eventDataString, URL_REGEX);
	const urlLabel = getRegexMatch(eventDataString, URL_LABEL_REGEX);
	const descriptionMatch = getRegexMatch(eventDataString, DESCRIPTION_REGEX);
	const host = getRegexMatch(eventDataString, HOST_REGEX);
	//
	let description;
	if (typeof descriptionMatch !== "string") {
		description = eventDataString;
	} else {
		const descriptionParts = [];
		if (typeof host === "string") {
			descriptionParts.push(`Hosted by ${host}.`);
		}
		descriptionParts.push(descriptionMatch);
		description = descriptionParts.join(" ");
	}
	return { url, urlLabel, description };
}
