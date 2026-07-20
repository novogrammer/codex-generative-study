import './style.css'
import { Application } from './Application'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('Application root was not found.')
}

const application = new Application(root)

application.init().catch((error: unknown) => {
  console.error(error)
  root.innerHTML = `
    <main class="error-message">
      <h1>Unable to start the scene</h1>
      <p>WebGPU or WebGL 2 is required. See the browser console for details.</p>
    </main>
  `
})
