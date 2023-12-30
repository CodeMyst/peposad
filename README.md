# peposad

## setup

* install bun
* run `bun i`

## create bot application

* go to https://discord.com/developers
* create new application
* enable bot

## invite the bot to a server

* go to discord developers dashboard
* go to oauth2 -> url generator
* scopes: bot, applications.commands
* permissions: read messages/view channels, send messages, use slash commands
* copy the url and open in the browser

## create .env.local

* create .env.local

```env
TOKEN=discord bot token
APP_ID=discord application id
SERVER_ID=server id (right click server -> copy id)
SAD_EMOTE=emote, send the emote with a backslash: \:peposad: and copy that here
HAPPY_EMOTE=...
LAUGH_EMOTE=...
TEXT_CHANNEL=channel id (right click channel -> copy id)
VOICE_CHANNEL=...
```

## register commands

* this needs to be done only once per server or when the commands change (i think)
* run `bun run register_commands.ts`
* commands should now be available in the server (you might need to wait for a bit)

## run the bot

* run `bun run index.ts`
