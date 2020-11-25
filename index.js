const { create, Client } = require('@open-wa/wa-automate')
const welcome = require('./lib/welcome')
const left = require('./lib/left')
const cron = require('node-cron')
const fs = require('fs')
const figlet = require('figlet')
const options = require('./options')

// AUTO UPDATE BY NURUTOMO
// THX FOR NURUTOMO
// Cache handler and check for file change
require('./binn.js')
nocache('./binn.js', module => console.log(`'${module}' Updated!`))

const adminNumber = JSON.parse(fs.readFileSync('./lib/admin.json'))
const setting = JSON.parse(fs.readFileSync('./lib/setting.json'))
const isWhite = (chatId) => adminNumber.includes(chatId) ? true : false

let { 
    limitCount,
    memberLimit, 
    groupLimit,
    mtc: mtcState,
    banChats,
    restartState: isRestart
    } = setting

function restartAwal(binn){
    setting.restartState = false
    isRestart = false
    binn.sendText(setting.restartId, 'Restart Succesfull!')
    setting.restartId = 'undefined'
    //fs.writeFileSync('./lib/setting.json', JSON.stringify(setting, null,2));
}

const start = async (binn = new Client()) => {
        console.log('------------------------------------------------')
        console.log(color(figlet.textSync('BM-BOT', { horizontalLayout: 'full' })))
        console.log('------------------------------------------------')
        console.log('[DEV] BINN')
        console.log('[SERVER] Server Started!')
        binn.onAnyMessage((fn) => messageLog(fn.fromMe, fn.type))
        // Force it to keep the current session
        binn.onStateChanged((state) => {
            console.log('[Client State]', state)
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') binn.forceRefocus()
        })
        // listening on message
        binn.onMessage((async (message) => {

        binn.getAmountOfLoadedMessages() // Cut message Cache if cache more than 3K
            .then((msg) => {
                if (msg >= 1000) {
                    console.log('[CLIENT]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    binn.cutMsgCache()
                }
            })
        // Message Handler (Loaded from recent cache)
        require('./binn.js')(binn, message)
        require('./lib/help.js')(binn, message)
    }))
           

        binn.onGlobalParicipantsChanged((async (heuh) => {
            await welcome(binn, heuh) 
            left(binn, heuh)
            }))
        
        binn.onAddedToGroup(async (chat) => {
            if(isWhite(chat.id)) return binn.sendText(chat.id, 'Halo aku BM-BOT, Ketik #help Untuk Melihat List Command Ku...')
            if(mtcState === false){
                const groups = await binn.getAllGroups()
                // BOT group count less than
                if(groups.length > groupLimit){
                    await binn.sendText(chat.id, 'Maaf, Batas group yang dapat BM-BOT tampung sudah penuh').then(async () =>{
                        binn.deleteChat(chat.id)
                        binn.leaveGroup(chat.id)
                    })
                }else{
                    if(chat.groupMetadata.participants.length < memberLimit){
                        await binn.sendText(chat.id, `Maaf, BOT keluar jika member group tidak melebihi ${memberLimit} orang`).then(async () =>{
                            binn.deleteChat(chat.id)
                            binn.leaveGroup(chat.id)
                        })
                    }else{
                        if(!chat.isReadOnly) binn.sendText(chat.id, 'Halo aku BM-BOT, Ketik #help Untuk Melihat List Command Ku...')
                    }
                }
            }else{
                await binn.sendText(chat.id, 'BM-BOT sedang maintenance, coba lain hari').then(async () => {
                    binn.deleteChat(chat.id)
                    binn.leaveGroup(chat.id)
                })
            }
        })

        /*binn.onAck((x => {
            const { from, to, ack } = x
            if (x !== 3) binn.sendSeen(to)
        }))*/

        // listening on Incoming Call
        binn.onIncomingCall(( async (call) => {
            await binn.sendText(call.peerJid, 'Maaf, saya tidak bisa menerima panggilan. nelfon = block!.\nJika ingin membuka block harap chat Owner!')
            .then(() => binn.contactBlock(call.peerJid))
        }))
    }

/**
 * Uncache if there is file change
 * @param {string} module Module name or path
 * @param {function} cb <optional> 
 */
function nocache(module, cb = () => { }) {
    console.log('Module', `'${module}'`, 'is now being watched for changes')
    fs.watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })
}

/**
 * Uncache a module
 * @param {string} module Module name or path
 */
function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

create(options(true, start))
    .then(binn => start(binn))
    .catch((error) => console.log(error))
