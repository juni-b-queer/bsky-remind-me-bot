import { add, addDays, addWeeks, addMonths } from "date-fns";

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
                value = convertWordsToNumbers(value)  // Using words-to-numbers function to convert words to numbers
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

export function convertWordsToNumbers(numberString: string): string {

    const units: { [key: string]: number } = {
        zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
        eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
        fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
        eighteen: 18, nineteen: 19,
    };

    const tens: { [key: string]: number } = {
        twenty: 20, thirty: 30, forty: 40, fifty: 50,
        sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    };

    const scales: { [key: string]: number } = {
        hundred: 100, thousand: 1000,
        million: 1000000, billion: 1000000000,
    };

    let result = 0;
    let current = 0;
    const words = numberString.split(/[\s-]+/);

    words.forEach(word => {
        const unit = units[word];
        const scale = scales[word];
        const ten = tens[word];

        if (unit !== undefined) {
            current += unit;
        } else if (ten !== undefined) {
            current += ten;
        } else if (scale !== undefined) {
            current *= scale;
            result += current;
            current = 0;
        } else {
            return "";
        }
    });

    result += current;
    return result.toString();
}

export function trimCommandInput(input: string, command: string): string|boolean{
    if(input.startsWith(`!${command}`)){
        return input.replace(`!${command}`, "").trim()
    }else if(input.startsWith(`${command}!`)){
        return input.replace(`${command}!`, "").trim()
    }else{
        return false;
    }
}