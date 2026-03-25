# Agent Notes and Lessons Learned

## macOS: `grep -P` is not available

BSD grep on macOS does not support `-P` (PCRE). Use the Grep tool instead of bash grep, or use `grep -E` for extended regex. For non-ASCII character detection, use `LC_ALL=C grep -n '[^\x00-\x7F]'` or the Grep tool.

## ruff: removed rules change across versions

`ANN101` (missing self annotation) and `ANN102` (missing cls annotation) were removed in newer ruff versions. Do not include them in ignore lists. Check ruff's changelog when pinning rule sets.

## uv: `uv init` generates a boilerplate `main.py`

`uv init` creates a `main.py` with a hello-world function. Use `uv init --no-readme` to skip the README but there is no flag to skip `main.py`. Delete it manually if not needed.

## Snowflake connection may default to PUBLIC role

The active Snowflake connection can default to the `PUBLIC` role, which lacks most privileges. Always check `SELECT CURRENT_ROLE()` before running DDL and switch with `USE ROLE <role>` if needed. Saves a wasted round-trip on permission errors.

## Edit tool `replace_all` fails on files with many occurrences

The `edit` tool's `replace_all` parameter can still reject edits when the target string appears many times (e.g., 7+ occurrences in a SQL file). Fall back to `sed -i '' 's/old/new/g'` via bash for bulk replacements in a single file.

## Always grep-sweep after bulk renames

When renaming an identifier across multiple files, run a `grep` sweep afterward to catch stale references. Parallel edits can miss occurrences due to ordering issues or duplicate matches. Pattern: rename first, then verify with `grep -rn OLD_NAME path/`.
