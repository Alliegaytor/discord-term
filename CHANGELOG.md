## [1.4.0] - 2023.01.24

### IMPORTANT
This changelog only includes changes that were introduced since the last commit by AL1L on their github project. It may not include everything since the last release on npm.

### Added
- /edit to edit messages
- /help tab completion
- /deletechannel for channel deletion
- /tg /tc to toggle channel and server browser menus
- Improved error handling. Warnings and errors are now colored yellow and red
- Permission checking
- Server browser (akin to the channel browser)
- Toggle emojis on/off (the preference is remembered)

### Changed
- Client will now load previous messages in a channel
- /now became /where as it shows you where you are
- Improved /reset
- Compiler options for typescript
	- Strict typing
	- Refactored code from commonjs -> nodenext
- Headerbar can now show active server
- Re-licensed project (see README and LICENSE for more details)

### Fixes
- Typing no longer crashes if client cannot type in a channel
- UI fixes
- Emojis no longer break\*

### Dependencies
#### Bumped
- discord.js from 12.3.1 -> 14.7.1
- typescript from 4.0.2 -> 4.9.4
- @types/node from 12.7.3 -> 18.11.18
- @types/blessed from 0.1.12 -> 0.1.19
- clipboardy from 2.1.0 -> 3.0.0
- chalk from 2.4.2 -> 5.2.0

#### Added
- string-width 5.1.2


\* Not as badly as before
