const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  session
} = require('electron')

const path = require('path')

/* ===========================
   CONFIG
=========================== */

app.setAppUserModelId('com.spofree.musicplayer')

app.commandLine.appendSwitch(
  'disable-features',
  'ThirdPartyCookies,ThirdPartyStoragePartitioning'
)

app.setPath(
  'userData',
  path.join(app.getPath('appData'), 'SPOFREE')
)

let win
let tray

/* ===========================
   CONTROLLER
=========================== */

function togglePlayPause() {
  if (!win) return

  win.webContents.executeJavaScript(`
    (function () {
      const iframe = document.querySelector('iframe[src*="spofree.vercel.app"]')
      if (!iframe) return

      const doc = iframe.contentWindow.document
      const btn =
        doc.querySelector('[data-testid="play-button"]') ||
        doc.querySelector('button[aria-label*="Play"]') ||
        doc.querySelector('button')

      btn && btn.click()
    })()
  `)
}

function nextTrack() {
  if (!win) return

  win.webContents.executeJavaScript(`
    (function () {
      const iframe = document.querySelector('iframe[src*="spofree.vercel.app"]')
      if (!iframe) return

      const doc = iframe.contentWindow.document
      const btn =
        doc.querySelector('[data-testid="next-button"]') ||
        doc.querySelector('button[aria-label*="Next"]')

      btn && btn.click()
    })()
  `)
}

function previousTrack() {
  if (!win) return

  win.webContents.executeJavaScript(`
    (function () {
      const iframe = document.querySelector('iframe[src*="spofree.vercel.app"]')
      if (!iframe) return

      const doc = iframe.contentWindow.document
      const btn =
        doc.querySelector('[data-testid="previous-button"]') ||
        doc.querySelector('button[aria-label*="Previous"]')

      btn && btn.click()
    })()
  `)
}

/* ===========================
   Main Window
=========================== */

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets/app.ico'),
    show: true,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      autoplayPolicy: 'no-user-gesture-required',
      partition: 'persist:spofree',
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadURL('https://spo.free.nf')

  win.webContents.on('did-finish-load', () => {
  win.webContents.executeJavaScript(`
    (function () {
      if (!('mediaSession' in navigator)) return

      function withPlayer(fn) {
        const iframe = document.querySelector('iframe[src*="spofree.vercel.app"]')
        if (!iframe) return
        fn(iframe.contentWindow.document)
      }

      navigator.mediaSession.setActionHandler('play', () => {
        withPlayer(doc => {
          doc.querySelector('button')?.click()
        })
      })

      navigator.mediaSession.setActionHandler('pause', () => {
        withPlayer(doc => {
          doc.querySelector('button')?.click()
        })
      })

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        withPlayer(doc => {
          doc.querySelector('[data-testid="next-button"]')?.click()
        })
      })

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        withPlayer(doc => {
          doc.querySelector('[data-testid="previous-button"]')?.click()
        })
      })
    })()
  `)
})


  win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      win.hide()
    }
  })
}

/* ===========================
   TRAY 
=========================== */

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/app.ico'))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => win.show()
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.isQuiting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('SPOFREE Music Player')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => win.show())
}

/* ===========================
   APP READY
=========================== */

app.whenReady().then(() => {
  const ses = session.fromPartition('persist:spofree')

  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'storage-access' || permission === 'cookies') {
      return callback(true)
    }
    callback(false)
  })

  createWindow()
  createTray()

})

/* ===========================
   CLEANUP
=========================== */

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
