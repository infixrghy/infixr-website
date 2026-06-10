/**
 * schema/common.ts — shared schema atoms used by more than one schema module.
 *
 * Only cross-cutting primitives live here, extracted when a SECOND consumer
 * appears (IsoDate was declared verbatim-twice in post.ts + glass-card.ts);
 * domain structs stay in their own files.
 */
import { Schema } from "effect";

/** ISO calendar date, e.g. "2026-05-01". Validated by pattern, kept as a STRING
 *  (not Date): builds are deterministic and string dates avoid timezone drift in
 *  the rendered <time>. Consumed by post front-matter (`date`) and the
 *  glass-card meta footer (`date`). */
export const IsoDate = Schema.NonEmptyString.pipe(
  Schema.check(
    Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/, {
      title: "ISO date",
      description: "date must be ISO YYYY-MM-DD",
    })
  )
);
