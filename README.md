# ⚠️ In active development!
Is forked from the [original project](https://github.com/AL1L/discord-term) on github. [Alliegaytor/discord-term](https://github.com/Alliegaytor/discord-term) has the most up to date source tree.

The project needs active maintainers. Any help would be greatly appreciated!

<br/>

### ✨ Discord Terminal

A cross platform extensible Discord terminal client. Can currently be only used with bot tokens. User tokens don't work properly as [discord.js](https://github.com/discordjs/discord.js) blocks them from being used. This is unwanted behaviour, however. We are trying to patch user tokens back in.

**Disclaimer**: So-called "self-bots" are against Discord's Terms of Service and therefore heavily discouraged. We am not responsible for any bans whatsoever caused by this software. This program is intended to be used with a **bot token** which is compliant with Discord's Terms of Service.

### Screenshots

## Linux preview
![Linux preview](https://i.imgur.com/CBbhXTP.gif)

## Windows 10 preview
![Windows 10 preview](https://i.ibb.co/JK3SGdJ/e.png)

### Get Started

Setting up is extremely easy. Just issue the following commands:

```shell
git clone https://gitlab.com/P-90-For-Retail/discord-term.git
npm install
npm run start
```

To install on your system:

```shell
sudo npm install -g
```

That's it! Although keep in mind that since the project is unfinished, you might encounter some bugs here and there. Please report them if you do find them!

**This project has been tested and verified as working on native Ubuntu terminal and Windows command prompt + PowerShell using Node.js 10**

Pst. Consider **starring** the repository if you like it! <3


### Usage

Once you've started the program, use `/login <token>` to connect to Discord. Alternatively you can use the environmental variable `DTERM_TOKEN` to login.

See the links below for information on retrieving login tokens:

* [Retrieve a bot token](https://discordapp.com/developers/applications/me)
<!--* [Retrieve a user token](https://discordhelp.net/discord-token)-->

You can issue the `/help` command to display all available commands.

Discord Terminal will show you the first channel in the first server that the Discord API is set to find. The channels are on the left hand side and you can click on them to navigate through them. The previous  

### Planned Features

- [X] Re-write & expand codebase

- [X] Discord.js v13

- [X] Editable DMs

- [ ] Documentation

- [ ] Support threads

- [ ] Userbot

- [ ] Status bar (current channel, guild, etc.)

- [ ] Message logging (with file-based or database support)

- [ ] Better, powerful plugin API

- [ ] Visual plugin manager

- [ ] Tested codebase (unit testing)

- [ ] SSH support

### Tricks & Tips

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

    Want more? Make your own! Checkout how those themes were made under the **themes** directory (Psst. It's easy!).

    Don't forget to create a merge request submitting your awesome theme so everyone can use it!

4. **Pasting in the terminal** You can use **CTRL + SHIFT + V** to paste data in most terminals.

5. **Neat details** There's some cool magic behind the scenes that you might not know about:
    1. Just have your token in your clipboard before starting the application, it will automatically detect it and login.
    2. Alternatively, you can set the **DTERM_TOKEN** environment variable and it will use it to automatically login.
    3. If you ever need to force a re-render because the UI might be buggy or so, use the **/reset** command.
    4. Pressing the **UP** arrow key after sending a message will allow you to edit it (similar functionality to Discord).
    5. Pressing the **DOWN** arrow key will delete your last message (if there was any).

6. **Super-secret mode** Discord Terminal has this cool security feature that allows you to send + receive encrypted messages, and all you need to do is set a password.

    1. **/encrypt secret_password_here_no_spaces** This will set your decryption/encryption password
    2. **/doencrypt** Toggle automatic encryption of messages

    From now on, your messages will be sent encrypted, preventing anyone (including Discord) from deciphering them **unless** they have set the same password as you. This way, you can give your friends the secret password and both talk in an encrypted, safe manner.

    Any encrypted messages sent by other users using Discord Terminal will be intercepted and attempted to be decrypted with the currently set decryption key.

    **Note**: Your friend(s) must have set the same password in order to view your messages!

    Keep in mind that your password cannot contain spaces.

Thanks to all these wonderful people for contributing to the project:

* [@AL1L](https://github.com/AL1L)
* [@anirudhbs](https://github.com/anirudhbs)
* [@jellz](https://github.com/jellz)
* [@JustCaptcha](https://github.com/JustCaptcha)
* [@Alliegaytor](https://gitlab.com/P-90-For-Retail/)
