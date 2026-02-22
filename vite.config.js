import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

const localIP = getLocalIP()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5194,
    host: '0.0.0.0',
    strictPort: true,
    onListen: () => {
      console.log(`\n🔴 RedDrop is running!`)
      console.log(`   Local:   http://localhost:5194`)
      console.log(`   Network: http://${localIP}:5194`)
      console.log('')
    }
  }
})
