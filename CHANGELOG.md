## \[1.5.0] - 2023.02.04

### Main commits

*   Update README.md, CONTRIBUTING.md
*   Add ability to edit more than the most recent message ([b4f16a7](https://gitlab.com/P-90-For-Retail/discord-term/commit/b4f16a7))
*   Detect if message is an image/embed, upload images with /img ([4930f1d](https://gitlab.com/P-90-For-Retail/discord-term/commit/4930f1d))
*   Don't upload directories or token from state.json ([e53476e](https://gitlab.com/P-90-For-Retail/discord-term/commit/e53476e))
*   Ensure state.json exists ([8563875](https://gitlab.com/P-90-For-Retail/discord-term/commit/8563875))
*   Fix .gitignore ([b53e68e](https://gitlab.com/P-90-For-Retail/discord-term/commit/b53e68e))
*   Fix encryption ([80f67e2](https://gitlab.com/P-90-For-Retail/discord-term/commit/80f67e2))
*   Improve state ([7b0db2a](https://gitlab.com/P-90-For-Retail/discord-term/commit/7b0db2a))
*   Initial framework for tests & rework of tags ([1a98fbe](https://gitlab.com/P-90-For-Retail/discord-term/commit/1a98fbe))
*   Merge conflicts & lint ([a694c87](https://gitlab.com/P-90-For-Retail/discord-term/commit/a694c87))
*   Move uploadHandler to its own file ([d9ef4a1](https://gitlab.com/P-90-For-Retail/discord-term/commit/d9ef4a1))
*   Remove /mute, remove unused events, improve tab completion ([7886f40](https://gitlab.com/P-90-For-Retail/discord-term/commit/7886f40))
*   Split MessageFactory create into two functions ([045792e](https://gitlab.com/P-90-For-Retail/discord-term/commit/045792e))
*   Update tests ([593f49b](https://gitlab.com/P-90-For-Retail/discord-term/commit/593f49b))

## \[1.4.2] - 2023.02.02

### Added

*   Print users on server switching
*   Gitlab CI pipelines
*   Unit tests (in development)
*   Lint command: `npm run lint`
*   Information about contributing

### Changes

*   Project name from discord-term -> discord-term-ng
*   Memory improvements
    *   /debug now includes memory usage information
*   Improve build time
*   Improve /dm and /tag
*   Improve /edit and /delete
*   Improve word wraping
*   Bumped node version from 14.16 -> 16.9.0

### Fixes

*   Code refactor
    *   Use typescript linter
    *   Cleanup
*   Checks for if client is logged in

### (dev)Dependencies

#### Bumped

*   typescript from 4.9.4 -> 4.9.5

#### Added

*   @types/jest 29.4.0
*   @typescript-eslint/eslint-plugin 5.50.0
*   @typescript-eslint/parser 5.50.0
*   eslint 8.33.0
*   jest 29.4.1
*   ts-jest 29.0.5
*   ts-node 10.9.1

## \[1.4.0] - 2023.01.24

### IMPORTANT

This changelog only includes changes that were introduced since the last commit by AL1L on their github project. It may not include everything since the last release on npm.

### Added

*   /edit to edit messages
*   /help tab completion
*   /deletechannel for channel deletion
*   /tg /tc to toggle channel and server browser menus
*   Improved error handling. Warnings and errors are now colored yellow and red
*   Permission checking
*   Server browser (akin to the channel browser)
*   Toggle emojis on/off (the preference is remembered)

### Changed

*   Client will now load previous messages in a channel
*   /now became /where as it shows you where you are
*   Improved /reset
*   Compiler options for typescript
    *   Strict typing
    *   Refactored code from commonjs -> nodenext
*   Headerbar can now show active server
*   Re-licensed project (see README and LICENSE for more details)

### Fixes

*   Typing no longer crashes if client cannot type in a channel
*   UI fixes
*   Emojis no longer break\*

### Dependencies

#### Bumped

*   discord.js from 12.3.1 -> 14.7.1
*   typescript from 4.0.2 -> 4.9.4
*   @types/node from 12.7.3 -> 18.11.18
*   @types/blessed from 0.1.12 -> 0.1.19
*   clipboardy from 2.1.0 -> 3.0.0
*   chalk from 2.4.2 -> 5.2.0

#### Added

*   string-width 5.1.2

\* Not as badly as before
