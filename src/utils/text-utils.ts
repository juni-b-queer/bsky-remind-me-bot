import { add, addDays, addWeeks, addMonths } from "date-fns";
import wordsToNumbers from "words-to-numbers";

export function flattenTextUpdated(triggerKey: string, input: string) {
    if (!containsNumbers(triggerKey)) {
        input = removeNumbers(input)
    }
    if (!containsPunctuation(triggerKey)) {
        input = removePunctuation(input)
    }
    if (!containsSpaces(triggerKey)) {
        input = removeSpaces(input)
    }
    return input.toLowerCase();
}

export function removePunctuation(input: string) {
    return input.replace(/[.,\/#!$?%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ")
}

export function removeNumbers(input: string) {
    return input.replace(/[0-9]/g, "");
}

export function removeSpaces(input: string) {
    return input.replace(" ", "");
}

export function containsNumbers(str) {
    return /\d/.test(str);
}

export function containsPunctuation(str) {
    return /\p{P}/gu.test(str);
}

export function containsSpaces(str) {
    return str.includes(" ");
}

export function convertTextToDate(timeString: string, currentTime: Date = new Date()) {
    let units = ["second", "minute", "hour", "day", "week", "month", "quarter", "year"];
    let parts = timeString.split(/[\s,]+and\s|,/).map(item => item.trim());
    let date = new Date(currentTime.getTime());

    let invalidInput = false;

    parts.forEach(part => {
        if (part === "tomorrow") {
            date = addDays(date, 1);
        } else if (part === "next week") {
            date = addWeeks(date, 1);
        } else if (part === "next month") {
            date = addMonths(date, 1);
        } else {
            let [value, timeUnit] = part.trim().split(" ");

            if (!units.includes(timeUnit) && !units.includes(timeUnit.slice(0, -1))) {
                invalidInput = true;
                return;
            }

            if(isNaN(Number(value))) {
                value = String(wordsToNumbers(value));
            }

            if (units.includes(timeUnit)){
                timeUnit += "s"; // Add 's' to make it plural as required by date-fns add function
            }

            let options = { [timeUnit]: Number(value) };

            // Calculate new date
            date = add(date, options);
        }
    });

    if (invalidInput) {
        return '';
    }

    // Convert the date to datetime string
    return date.toISOString();
}