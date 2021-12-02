# peposad

## setup

* install nodejs
* install npm
* run `npm i`

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

## create config.json

* create config.json

```json
{
    "id": "discord application id",
    "token": "discord bot token",
    "server": "server id (right click server -> copy id)",
    "channel": "channel id (right click channel -> copy id)",
    "emote": "emote, send the emote with a backslash: \:peposad: and copy that here"
}
```

## deploy commands

* this needs to be done only once per server or when the commands change (i think)
* run `npm run deploy_commands`
* commands should now be available in the server (you might need to wait for a bit)

## run the bot

* run `npm run start`
