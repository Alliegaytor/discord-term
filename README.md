# ⚠️ In active development!


[[_TOC_]]

# ✨ Discord Terminal

 [![Latest Release](https://gitlab.com/P-90-For-Retail/discord-term/-/badges/release.svg)](https://gitlab.com/P-90-For-Retail/discord-term/-/releases)  [![pipeline status](https://gitlab.com/P-90-For-Retail/discord-term/badges/master/pipeline.svg)](https://gitlab.com/P-90-For-Retail/discord-term/-/commits/master) [![NPM version](https://img.shields.io/npm/v/discord-term-ng.svg?style=flat)](https://www.npmjs.com/package/discord-term-ng) [![NPM monthly downloads](https://img.shields.io/npm/dm/discord-term-ng.svg?style=flat)](https://npmjs.org/package/discord-term-ng) [![NPM total downloads](https://img.shields.io/npm/dt/discord-term-ng.svg?style=flat)](https://npmjs.org/package/discord-term-ng) 

**Discord Terminal** is an extensible cross-platform Discord terminal client written in [Typescript](https://en.wikipedia.org/wiki/TypeScript) using [blessed](https://github.com/chjj/blessed) that aims to deliver an alternative take of the Discord user experience. The project is being worked on, and preliminary file upload support was just added. Support for viewing media in the client, among other features, are planned.

The project is looking for active maintainers. Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for more information. Any help would be greatly appreciated!


## **Disclaimer**
- > It is important to note that "self-bots" are against Discord's Terms of Service and therefore discouraged to use. We am not responsible for any bans whatsoever caused by this software as described in the project's license. This program is intended to be used with a **bot token** which is compliant with Discord's Terms of Service.


- >It can currently **only** be used with **bot tokens**.  **User tokens don't work at all**. [Discord.js](https://github.com/discordjs/discord.js) blocks self-botting, however we are looking into patching user tokens back in. Any help in this endeavour would be much appreciated.

## New home

[**Discord Term**](https://gitlab.com/P-90-For-Retail/discord-term) Is forked from the [original project](https://github.com/AL1L/discord-term) on github. [Alliegaytor/discord-term](https://github.com/Alliegaytor/discord-term) has the most recent source tree on github. It has since moved home to this gitlab repo, where all of the core development is taking place.

## Screenshots

### Linux preview
![Linux preview](https://i.imgur.com/56eoNyA.gif){width=100%}

### Windows 10 preview
![Windows 10 preview](https://i.ibb.co/JK3SGdJ/e.png){width=100%}

## Get Started

Setting up is extremely easy. Just issue the following commands to install and run **Discord Term** locally:

```shell
git clone https://gitlab.com/P-90-For-Retail/discord-term.git
cd discord-term
npm install
npm run start
```

### Help! My colors look weird!
If you are having issues with the colors or fonts try running with these env vars

```shell
LANG=en_US.utf8 TERM=xterm-256color npm run start
```

Windows users should try the [Windows Terminal](https://github.com/microsoft/terminal) first before reporting any issues.


## Installation

To install on your system globally:

```shell
sudo npm install -g
```

That's it! Although keep in mind that since the project is unfinished and WIP, you might encounter some bugs here and there. Please report them if you do find them!

**This project is tested and developed under Linux, using Alacritty terminal with Node.js 16 and typescript 4.9.4**

Pst. Consider **starring** the repository if you like it! <3


## Usage

Once you've started the program, use `/login <token>` to connect to Discord. Alternatively you can use the environmental variable `DTERM_TOKEN` or have your token in the clipboard to login.

See the links below for information on retrieving login tokens:

* [Retrieve a bot token](https://discordapp.com/developers/applications/me)
<!--* [Retrieve a user token](https://discordhelp.net/discord-token)-->

You can issue the `/help` command to display all available commands.

Discord Terminal will show you the first channel in the first server that the Discord API is set to find. The channels are on the left hand side and you can click on them to navigate through them.

The `/tc` command toggles the visibility of the channel picker, allowing you to quickly switch between channels. Similarly, the `/tg` command toggles the server (guild) picker. By default, only the channel picker is visible.

The `/tip` command displays some tips in the headerbar, which can be toggled with `/toggleheader`. Discord Term will store your preference. 

If you ever experience any graphical bugs, `/reset` *should* fix almost all visual problems. Resizing the window and using the `/clear` command have shown to sometimes fix ui issues as well. Disabling emojis with the `/emoji` command may also help.

<details>
<summary>

# Planned Features

</summary>

- [ ] Re-write & expand codebase

- [ ] Use [blessed-contrib](https://github.com/yaronn/blessed-contrib) with blessed (or a maintained blessed fork)

- [ ] Improved documentation

- [ ] Support threads

- [ ] Userbot

- [ ] Message logging (with file-based or database support)

- [ ] Better, powerful plugin API

- [ ] Visual settings editor

- [ ] Tested codebase (unit testing)

- [ ] SSH support

</details>

<hr>

# Tricks & Tips

1. **Get moving quickly!**
    You can easily switch between servers and channels using the **/tag** command.

    Example:

        For a channel:

        $ /tag dev 437051394592210944
        $ /c $dev

        Or for a guild:

        $ /tag gamingcorner 286352649610199052
        $ /g $gamingcorner

        Or for a user:

        $ /tag cloudrex 285578743324606482
        $ /dm $cloudrex hello

        You can even use them for normal messages!

        $ <@$cloudrex> => Would send the message: <@285578743324606482>

    Easy right?

    In Linux, you can also just click the channels ;)

2. **Change message format style**
    Customizability is what this project is heading for. I'm planning on adding support for plugins in the future! As of now, you can edit your message format and theme.

    Example:

        $ /format {sender} ~> {message}

        Or even more fancy:

        $ /format [{sender}] => {message}

    Try it out and match your style. Shiny!

3. **Change themes**
    Changing themes is easy. You can switch between themes using the **/themes** command.

    Example:

        $ /theme dark-red

    Themes included:

    * default
    * dark
    * dark-red
    * dark-blue
    * rose
    * ruby
    * rovel
    * discord
    * purple-glory

    Want more? Make your own! Checkout how those themes were made under the **themes** directory. It's all simple JSON!

    Don't forget to create a merge request submitting your awesome theme so everyone can use it!

4. **Pasting in the terminal** You can use **CTRL + SHIFT + V** to paste data in most terminals.

5. **Neat details** There's some cool magic behind the scenes that you might not know about:
    1. Just have your token in your clipboard before starting the application, it will automatically detect it and login.
    2. Alternatively, you can set the **DTERM_TOKEN** environment variable and it will use it to automatically login.
    3. If you ever need to force a re-render because the UI might be buggy or so, use the **/reset** command.
    4. Pressing the **UP** arrow key after sending a message will allow you to edit it (similar functionality to Discord) or delete it if the edit is an empty string "". You can cycle through your message history on that particular channel.
    5. Pressing the **DOWN** arrow key will decrement your editing command to more recent messages (if there are any).
    6. Pressing  **ESCAPE** clears your current input.

6. **Super-secret mode** Discord Terminal has this cool security feature that allows you to send + receive encrypted messages, and all you need to do is set a password.

    1. **/encrypt secret_password_here_no_spaces** This will set your decryption/encryption password
    2. **/doencrypt** Toggle automatic encryption of messages

    From now on, your messages will be sent encrypted, preventing anyone (including Discord) from deciphering them **unless** they have set the same password as you. This way, you can give your friends the secret password and both talk in an encrypted, safe manner.

    Any encrypted messages sent by other users using Discord Terminal will be intercepted and attempted to be decrypted with the currently set decryption key.

    **Note**: Your friend(s) must have set the same password in order to view your messages!

    Keep in mind that your password cannot contain spaces.

    ⚠ **This feature has not been properly tested since code refractor. Do not rely on it (or anything in this project) for anything important.**


# License

The project is licensed under the [ISC](./LICENSE) license. The previous owner of the repo had released the project into public domain with the [Unlicense](https://choosealicense.com/licenses/unlicense/) license ([see 361b603d](https://gitlab.com/P-90-For-Retail/discord-term/-/commit/361b603d2f53b541d2fcce3c80b66d13ea2b02f8)). If, in your jurisdiction, the Unlicense license cannot legally release code into the public domain, the project is to be considered to be licensed with the Unlicense license up to and including commit [2a36c2c7](https://gitlab.com/P-90-For-Retail/discord-term/-/commit/2a36c2c73d9be23f3713c8b1b6d47ac8435798f1). Consequently, this software comes with no warranty of any kind.

# Contributors

Here are all the lovely people who have contributed to the project. It wouldn't be where it is at without you!

* [@AL1L](https://github.com/AL1L)
* [@anirudhbs](https://github.com/anirudhbs)
* [@jellz](https://github.com/jellz)
* [@JustCaptcha](https://github.com/JustCaptcha)
* [@Alliegaytor](https://gitlab.com/P-90-For-Retail/)
