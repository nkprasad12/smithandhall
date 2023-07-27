import * as mod from "https://deno.land/std@0.196.0/testing/asserts.ts";

import { handleEditorNotes } from "./process.ts";

Deno.test("handleEditorNotes leaves regular lines unchanged", () => {
  const input = "lit. <i>a horn</i>): <i>to discharge arrows from";
  mod.assertEquals(handleEditorNotes(input), input);
});

Deno.test("handleEditorNotes substitutes for one character with space", () => {
  const input = "Virg.[** :] Ov. Prov.: <i>to have two";
  const expected = "Virg.: Ov. Prov.: <i>to have two";
  mod.assertEquals(handleEditorNotes(input), expected);
});

Deno.test("handleEditorNotes substitutes for one character only", () => {
  const input = "Virg.[**:] Ov. Prov.: <i>to have two";
  const expected = "Virg.: Ov. Prov.: <i>to have two";
  mod.assertEquals(handleEditorNotes(input), expected);
});

Deno.test("handleEditorNotes substitutes in dash edge case", () => {
  const input = "[** ----] Ov. Prov.: <i>to have two";
  const expected = "---- Ov. Prov.: <i>to have two";
  mod.assertEquals(handleEditorNotes(input), expected);
});

Deno.test("handleEditorNotes removes no character notes", () => {
  const input = "remissus,[**] Hor. Phr.: <i>a manufactory";
  const expected = "remissus, Hor. Phr.: <i>a manufactory";
  mod.assertEquals(handleEditorNotes(input), expected);
});

Deno.test("handleEditorNotes removes multi-character notes", () => {
  const input =
    "remissus,[**P2: ,|P3 fixed, clear on TIA] Hor. Phr.: <i>a manufactory";
  const expected = "remissus, Hor. Phr.: <i>a manufactory";
  mod.assertEquals(handleEditorNotes(input), expected);
});
