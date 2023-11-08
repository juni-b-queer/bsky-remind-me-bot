
const inputFilename = "./assets/bee-formatted.txt";
const outputFilename = "./assets/output/bee-movie-skeets.ts";

export function convertTextToSkeets(inputText: string){
    let matches = inputText.match(/.{1,299}/g);
    console.log(matches)
    return matches
}

async function getFileContents(){
    const file = Bun.file(inputFilename);
    return await file.text();
}

async function writeToOutputFile(outputArray){
    let initialText = `export const SKEETS = [ ${outputArray.map(skeet => ` \n "${skeet}"`)} \n ]`;
    return await Bun.write(outputFilename, initialText)
}

/**
 * If text has a lot of new lines, remove them, if the text has quotes, escape them.
 */
async function formatText(){
    let text = await getFileContents();
    await Bun.write('./assets/bee-formatted.txt', text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s{2,}/g," ").replaceAll('"', '\\"'))
}
// await formatText()

let fileText = await getFileContents()

let skeets = convertTextToSkeets(fileText);

await writeToOutputFile(skeets)




