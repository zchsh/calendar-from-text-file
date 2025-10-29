import fs from "fs";
import { addDays, addHours, format } from "date-fns";
import { parseLocation } from "./parse-location.mjs";
import { shimAppleStructuredLocation } from "./shim-apple-structured-location.mjs";
import ics from "ics";

const [_, __, ...args] = process.argv;

const [CALENDAR_FILE, OUTPUT_FILE] = args;

main(CALENDAR_FILE, OUTPUT_FILE);

async function main(calendarFile, outputFile) {
	// Log what we'll be doing
	console.log(`🗓️ Converting "${calendarFile}" to "${outputFile}"...`);
	// Parse calendar events from the input file
	const parsedEvents = await parseCalendarFile(calendarFile);
	// Format to ics
	const { error: icsError, value: icsString } = ics.createEvents(
		parsedEvents.map((entry) => {
			return {
				start: entry.start,
				end: entry.end,
				title: entry.title,
				description: entry.description,
				geo: entry.geo,
				location: entry.location,
			};
		})
	);
	// If we had an error, throw it
	if (icsError) {
		throw new Error(`Error creating ICS file: ${JSON.stringify(icsError)}`);
	}
	/**
	 * Hack to get `X-APPLE-STRUCTURED-LOCATION` data into place,
	 * because Apple Calendar ignores the standard GEO property,
	 * and doesn't automatically look up the standard LOCATION property.
	 */
	const icsStringWithAppleBullshit = shimAppleStructuredLocation(icsString);
	// Write out the ics file
	fs.writeFileSync(outputFile, icsStringWithAppleBullshit);
	// Log that we're done
	console.log(`✅ Done!`);
}

async function parseCalendarFile(calendarFile) {
	// Read in the `Calendar.md` file from Obsidian, using fs.readFileSync
	const calendar = fs.readFileSync(calendarFile, "utf8");
	// Split the file into lines
	const lines = calendar.split("\n");
	// Identify valid lines - must start with `- YYYY-MM-DD`
	const validLines = lines.filter((line) => line.match(/^- \d{4}-\d{2}-\d{2}/));
	// Trim the prefix `- ` from each valid line
	const trimmedLines = validLines.map((line) => line.slice(2));
	// For each valid line, parse the start, end, title, and description
	const parsedEvents = [];
	for (const line of trimmedLines) {
		parsedEvents.push(await parseCalendarFileLine(line));
	}
	// Return the parsed events
	return parsedEvents;
}

async function parseCalendarFileLine(line) {
	const [datePart, ...restParts] = line.split(" - ");
	// Parse the title and description
	const [title, ...descriptionParts] = restParts.join(" - ").split(". ");
	const description = descriptionParts.join(". ");
	// Parse the start and end times
	const [startString, ...endStringParts] = datePart.split(" to ");
	const endString = endStringParts.join(" to ");
	// Parse the start and end event arrays
	const parsedStart = parseDateTimeString(startString);
	const parsedEnd = parseDateTimeString(endString);
	const { start, end } = parseEventStartEnd(parsedStart, parsedEnd);
	// Attempt to parse a latitude and longitude from the description
	const { lat, lon, locationLabel } = parseLocation(description);
	/**
	 * Attempt to parse a location label from the description
	 *
	 * NOTE: Apple Calendar REQUIRES a location property, otherwise it
	 * won't even display its own custom X-APPLE-STRUCTURED-LOCATION data.
	 * So, we add a fallback location if `lat` and `lon` are specified.
	 */
	const hasGeo = Boolean(lat && lon && !isNaN(lat) && !isNaN(lon));
	const hasLocation = typeof locationLabel === "string" && locationLabel !== "";
	/**
	 * TODO: if we have a location but no geo, could be neat to search the
	 * location on nomatim.org to see if we can get geo.
	 *
	 * API DOCS:
	 * https://nominatim.org/release-docs/develop/api/Search/
	 *
	 * EXAMPLE:
	 * https://nominatim.openstreetmap.org/search?q=Artisan+Bakery,+London,+Ontario&format=jsonv2
	 *
	 * Could cache the results in local text files, since I always run this
	 * update script from my computer anyways.
	 */
	const geo = hasGeo ? { lat, lon } : undefined;
	const location = hasLocation
		? locationLabel
		: hasGeo
		? "Event location"
		: undefined;
	// Return the formatted object
	return {
		line,
		// datePart,
		// startString,
		// parsedStart,
		// endString,
		// parsedEnd,
		geo,
		location,
		start,
		end,
		title,
		description,
	};
}

/**
 * Given a start and end date-time string, parse out the start and end
 * of an event. Tries to use sensible defaults when times are missing.
 *
 *
 */
function parseEventStartEnd(
	parsedStart,
	parsedEnd,
	defaultEventDurationHours = 1
) {
	const {
		date: startDate,
		time: startTime,
		hasSpecificTime: hasStartTime,
		hasSpecificDate: hasStartDate,
	} = parsedStart;
	const {
		date: endDate,
		time: endTime,
		hasSpecificTime: hasEndTime,
		hasSpecificDate: hasEndDate,
	} = parsedEnd;

	/**
	 * If we have a startDate, endDate, and a specific start and end time,
	 * this event spans multiple days with specific times. We can use the
	 * parsed dates and times directly.
	 *
	 * EXAMPLE: `2025-01-01 at 10:00 to 2025-02-02 at 12:00`
	 */
	if (hasStartDate && hasEndDate && hasStartTime && hasEndTime) {
		return {
			start: [...startDate, ...startTime],
			end: [...endDate, ...endTime],
			// type: "both-days-both-times",
		};
	}

	/**
	 * If we have a startDate, endDate, and a specific start time, but no end
	 * time, we assume the event ends at the very end of the end date.
	 *
	 * EXAMPLE: `2025-01-01 at 10:00 to 2025-02-02`,
	 * then infer end time `2025-02-02 23:59`
	 */
	if (hasStartDate && hasEndDate && hasStartTime && !hasEndTime) {
		return {
			start: [...startDate, ...startTime],
			end: [...endDate, 23, 59],
			// type: "both-days-start-time",
		};
	}

	/**
	 * If we have a startDate, endDate, and a specific end time, but no start
	 * time, we assume the event starts at the very start of the start date.
	 *
	 * EXAMPLE: `2025-01-01 to 00:30`, infer start time `2025-01-01 00:00`
	 */
	if (hasStartDate && hasEndDate && !hasStartTime && hasEndTime) {
		return {
			start: [...startDate, 0, 0],
			end: [...endDate, ...endTime],
			// type: "both-days-end-time",
		};
	}

	/**
	 * If we have a startDate and endDate, but no specific times,
	 * then this should be an all-day event spanning from the start date
	 * to the end date
	 *
	 * EXAMPLE: `2025-01-01 to 2025-01-03`
	 */
	if (hasStartDate && hasEndDate && !hasStartTime && !hasEndTime) {
		const startDateObj = new Date(startDate[0], startDate[1] - 1, startDate[2]);
		const endDateObj = addDays(
			new Date(endDate[0], endDate[1] - 1, endDate[2]),
			1
		);
		return {
			start: dateToArray(startDateObj),
			end: dateToArray(endDateObj),
			// type: "both-days-no-times",
		};
	}

	/**
	 * If we have a startDate, but no end date, and specific start and end
	 * times, we use the startDate for the end of the event as well.
	 *
	 * This is a typical case - events that start and end at specific
	 * times on a single date.
	 *
	 * EXAMPLE: `2025-01-01 from 10:00 to 12:00`
	 */
	if (hasStartDate && !hasEndDate && hasStartTime && hasEndTime) {
		return {
			start: [...startDate, ...startTime],
			end: [...startDate, ...endTime],
			// type: "start-day-both-times",
		};
	}

	/**
	 * If we have a startDate and a specific start time, but no end date or
	 * time, we assume the event is one hour long.
	 *
	 * EXAMPLE: `2025-01-01 at 23:30`, infer end time `2025-01-02 00:30`
	 */
	if (hasStartDate && !hasEndDate && hasStartTime && !hasEndTime) {
		const startDateObj = new Date(
			startDate[0],
			startDate[1] - 1,
			startDate[2],
			startTime[0],
			startTime[1]
		);
		const endDateObj = addHours(startDateObj, defaultEventDurationHours);
		return {
			start: [...startDate, ...startTime],
			end: dateTimeToArray(endDateObj),
			// type: "start-day-start-time",
		};
	}

	/**
	 * If we have a startDate and a specific end time, but no end date or
	 * end time, we assume the event is one hour long and ends at the
	 * specified end time.
	 *
	 * EXAMPLE: `2025-01-01 to 00:30`, infer start time `2024-12-31 23:30`
	 */
	if (hasStartDate && !hasEndDate && !hasStartTime && hasEndTime) {
		const endDateObj = new Date(
			startDate[0],
			startDate[1] - 1,
			startDate[2],
			endTime[0],
			endTime[1]
		);
		const startDateObj = addHours(endDateObj, -1 * defaultEventDurationHours);
		return {
			start: dateTimeToArray(startDateObj),
			end: dateTimeToArray(endDateObj),
			// type: "start-day-end-time",
		};
	}

	/**
	 * If we don't have an end date, or specific times, it's an single-day event
	 * like `2022-01-01`. We should add one day to the end date.
	 *
	 * EXAMPLE: `2025-01-01`
	 */
	if (hasStartDate && !hasEndDate && !hasStartTime && !hasEndTime) {
		const startDateObj = new Date(startDate[0], startDate[1] - 1, startDate[2]);
		const endDateObj = addDays(startDateObj, 1);
		return {
			start: dateToArray(startDateObj),
			end: dateToArray(endDateObj),
			// type: "start-day-no-times",
		};
	}

	/**
	 * Otherwise, we've missed a case, and should probably error out.
	 */
	throw new Error(
		`Unrecognized date-time format: startString "${startString}", endString "${endString}"`
	);
}

function dateToArray(dateObject) {
	return format(dateObject, "yyyy-MM-dd")
		.split("-")
		.map((part) => parseInt(part, 10));
}

function dateTimeToArray(dateObject) {
	return format(dateObject, "yyyy-MM-dd-HH-mm")
		.split("-")
		.map((part) => parseInt(part, 10));
}

/**
 * Given a string in any of the following formats:
 *
 * - `YYYY-MM-DD`
 * - `YYYY-MM-DD at HH:MM`
 * - `YYYY-MM-DD from HH:MM`
 *
 * Parse out the `date` and `time` parts, and return an object with the
 * following properties:
 * - `date`: an array with the year, month, and day parts.
 * - `time`: an array with the hours and minutes parts. Each part may be `null`.
 * - `hasSpecificTime`: a boolean indicating whether the time was intentionally
 *   set in the string.
 *
 * @param {*} dateTimeString
 * @returns
 */
function parseDateTimeString(dateTimeString) {
	// Build a regex to match `(YYYY-MM-DD)?(from|at|to)?(HH:MM)?`
	const dateTimeRegex =
		/(\d{4}-\d{2}-\d{2})?(\s*(from|at)\s*)?(\d{1,2}:\d{2})?/g;
	// Grab the matching dateString and timeString
	const match = dateTimeRegex.exec(dateTimeString);
	const [_input, dateString, _fromAt, _again, timeString] = match;
	const timeParts = timeString ? timeString.split(":") : [];
	// Parse year, month, day, hour, minutes integers (or null as fallback)
	const [year, month, day] = dateString
		? dateString.split("-").map((part) => {
				const result = parseInt(part, 10);
				return isNaN(result) || typeof result === "undefined" ? null : result;
		  })
		: [null, null, null];
	const [hours, minutes] =
		timeParts.length === 2
			? timeParts.map((part) => {
					const result = parseInt(part, 10);
					return isNaN(result) || typeof result === "undefined" ? null : result;
			  })
			: [null, null];
	// Determine if we have a valid date and time
	const hasSpecificDate = [year, month, day].every(
		(part) => typeof part === "number" && !isNaN(part)
	);
	const hasSpecificTime = [hours, minutes].every(
		(part) => typeof part === "number" && !isNaN(part)
	);
	return {
		date: [year, month, day],
		time: [hours, minutes],
		hasSpecificDate,
		hasSpecificTime,
	};
}
