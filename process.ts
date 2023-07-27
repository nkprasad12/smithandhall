import { readLines } from "https://deno.land/std@0.194.0/io/mod.ts";

const SHOW_FILE_NAMES = false;

const START_OF_FILE = "-----File:";
const START_OF_ENTRIES = "-----File: b0001l.png";
const END_OF_ENTRIES = "THE END.";
const KEPT_EDITOR_NOTE = /\[\*\*[ ]?([^\]]|----)\]/g;
const REMOVED_EDITOR_NOTE = /\[\*\*[^\]]*\]/g;

const CORRECTIONS = new Map<string, string>([
  [`<i>affable</i>:`, `<b>affable</b>:`],
  [`beside (<i>prep.</i>):`, `<b>beside</b> (<i>prep.</i>):`],
  [
    `bibliopolist[**"li" unclear]: biblĭŏpōla: Plin.:`,
    `<b>bibliopolist</b>: biblĭŏpōla: Plin.:`,
  ],
  [
    `bigness: v. <f>BULK</f>, <f>SIZE</f>.`,
    `<b>bigness</b>: v. <f>BULK</f>, <f>SIZE</f>.`,
  ],
  [`<i>cricket</i>:`, `<b>cricket</b>:`],
  [
    `<i>crier</i>: praeco, ōnis, <i>m.</i> (the most gen.`,
    `<b>crier</b>: praeco, ōnis, <i>m.</i> (the most gen.`,
  ],
  [`<i>darkish</i>:`, `<b>darkish</b>:`],
  [
    `<i>defloration</i>: stuprum: v. <f>DEBAUCHERY</f>,`,
    `<b>defloration</b>: stuprum: v. <f>DEBAUCHERY</f>,`,
  ],
  [`<f>earnestness</f>:`, `<b>earnestness</b>:`],
  [
    `<i>foot-soldier</i>: pĕdes, ĭtis, c.: Caes.:`,
    `<b>foot-soldier</b>: pĕdes, ĭtis, c.: Caes.:`,
  ],
  [
    `<f>foreman</f>: i. e., <i>manager, overseer</i>:`,
    `<b>foreman</b>: i. e., <i>manager, overseer</i>:`,
  ],
  [
    `<i>instill</i>: instillo, 1 (with <i>acc.</i> and`,
    `<b>instill</b>: instillo, 1 (with <i>acc.</i> and`,
  ],
  [
    `<i>parallelism</i>: v. <f>PARALLEL</f> (<i>adj.</i>).`,
    `<b>parallelism</b>: v. <f>PARALLEL</f> (<i>adj.</i>).`,
  ],
  [`remittance: pecunia may be used`, `<b>remittance</b>: pecunia may be used`],
  [
    `<i>snaffle</i> (<i>v.</i>): v. <f>TO BIT</f>, <f>BRIDLE</f>.`,
    `<b>snaffle</b> (<i>v.</i>): v. <f>TO BIT</f>, <f>BRIDLE</f>.`,
  ],
  [
    `thrum (<i>subs.</i>): līcium: <i>to add t.s to`,
    `<b>thrum</b> (<i>subs.</i>): līcium: <i>to add t.s to`,
  ],
]);

const HEADERS = "ABCDEFGHIJKLMNOPQRSTUVWYZ";
const SENSE_LEVELS = /^([A-Za-z0-9]|I|II|III|IV|V)$/;

interface ShSense {
  level: string;
  text: string;
}

interface ShEntry {
  key: string;
  blurb?: string;
  senses?: ShSense[];
}

type ParseState =
  | "Unstarted"
  | "NotInArticle"
  | "InArticle"
  | "MaybeEndingArticle";

function exhaustiveGuard(_value: never): never {
  throw new Error(
    `ERROR! Reached forbidden guard function with unexpected value: ${
      JSON.stringify(_value)
    }`,
  );
}

function lineEmpty(input: string): boolean {
  return input.trim().length === 0;
}

export function handleEditorNotes(input: string): string {
  return input.replace(KEPT_EDITOR_NOTE, "$1").replace(REMOVED_EDITOR_NOTE, "");
}

/**
 * Rules for starting articles:
 * 1. Single letter + . can be skipped
 * 2.
 */

async function processFile() {
  const file = await Deno.open("./sh_F2_latest.txt");
  if (file === null) {
    return;
  }
  const entries: ShEntry[] = [];
  let nextHeaderIndex = 0;
  let state: ParseState = "Unstarted";
  let lastFile: string | null = null;
  for await (const input of readLines(file)) {
    if (input.startsWith(START_OF_FILE)) {
      lastFile = input;
    }
    if (input === END_OF_ENTRIES) {
      // OK to break because we have two blank lines before this.
      break;
    }

    const corrected = CORRECTIONS.get(input) || input;
    const line = handleEditorNotes(corrected);
    switch (state) {
      case "Unstarted":
        if (line.startsWith(START_OF_ENTRIES)) {
          state = "NotInArticle";
        }
        break;
      case "NotInArticle":
        if (lineEmpty(line)) {
          continue;
        }
        if (line.startsWith("<b>")) {
          // The expected case - a new article is starting.
          state = "InArticle";
          continue;
        }
        if (line.startsWith("---- <b>")) {
          // A special case, where the dashes should be filled in by
          // the name of the last non-dashed article. Note that the bold
          // after the space should also be considered part of the entry name.
          state = "InArticle";
          continue;
        }
        if (line.startsWith("----, <b>")) {
          // A special case, where the dashes should be filled in by
          // the name of the last non-dashed article. Note that the bold
          // after the comma should also be considered part of the entry name.
          state = "InArticle";
          continue;
        }
        if (line.startsWith("---- ")) {
          // A special case, where the dashes should be filled in by
          // the name of the last non-dashed article. This only happens once.
          state = "InArticle";
          continue;
        }
        if (line === "/*") {
          // TODO: Figure out what to do here
          state = "InArticle";
          continue;
        }

        if (
          /^[A-Z]\.$/.test(line) && nextHeaderIndex < HEADERS.length &&
          line === HEADERS.charAt(nextHeaderIndex) + "."
        ) {
          // We got a section header - A, B, C, D, E, etc...
          nextHeaderIndex += 1;
          continue;
        }

        if (SENSE_LEVELS.test(line.split(".")[0])) {
          // We have a sense that was accidentally separated from its article.
          // This should be added on to the previous sense.
          state = "InArticle";
          continue;
        }

        if (SHOW_FILE_NAMES) {
          console.log(lastFile);
        }
        console.log(line);

        state = "InArticle";
        break;
      case "InArticle":
        if (lineEmpty(line)) {
          state = "MaybeEndingArticle";
        }
        break;
      case "MaybeEndingArticle":
        state = lineEmpty(line) ? "NotInArticle" : "InArticle";
        break;
      default:
        return exhaustiveGuard(state);
    }
  }
}

processFile();
