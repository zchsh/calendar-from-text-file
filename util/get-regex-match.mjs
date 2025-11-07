/**
 * TODO: write description
 *
 * @param {*} inputString
 * @param {*} regexWithOneMatchGroup
 * @returns
 */
export function getRegexMatch(inputString, regexWithOneMatchGroup) {
	const matchResult = inputString.match(regexWithOneMatchGroup);
	if (!matchResult) {
		return undefined;
	}
	const [_matchFull, matchString] = matchResult;
	if (typeof matchString !== "string" || matchString == "") {
		return undefined;
	}
	return matchString;
}
