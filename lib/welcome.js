const fs = require('fs-extra')

module.exports = welcome = async (binn, event) => {
    //console.log(event.action)
    const welkom = JSON.parse(fs.readFileSync('./lib/welcome.json'))
    const isWelkom = welkom.includes(event.chat)
    try {
        if (event.action == 'add' && isWelkom) {
            const gChat = await binn.getChatById(event.chat)
            const pChat = await binn.getContact(event.who)
            const { contact, groupMetadata, name } = gChat
            const pepe = await binn.getProfilePicFromServer(event.who)
            const capt = `Halo @${event.who.replace('@c.us', '')} 👋\nSelamat datang di *Grup ${name}*\n═══════════════════\nSelamat bergabung dan juga semoga betah disini.\n═══════════════════\n`
            if (pepe == '' || pepe == undefined) {
                await binn.sendFileFromUrl(event.chat, 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTQcODjk7AcA4wb_9OLzoeAdpGwmkJqOYxEBA&usqp=CAU', 'profile.jpg')
            } else {
                await binn.sendFileFromUrl(event.chat, pepe, 'profile.jpg')
                binn.sendTextWithMentions(event.chat, capt)
            }

        }
    } catch (err) {
        console.log(err)
    }
}
