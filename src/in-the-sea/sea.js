let animationFrame = null

const MANTA_RENDERER = {
  MANTA_COUNT: 3,
  ADD_INTERVAL: 30,
  DELTA_THETA: Math.PI / 1000,

  init() {
    this.setParameters()
    this.reconstructMethod()
    this.createMantas()
    this.render()
  },
  destroy() {
    this.$container.removeChild(this.$container.firstChild)
  },
  setParameters() {
    this.$container = document.getElementById('jsi-sea-container')
    this.width = window.innerWidth
    this.height = window.innerHeight

    const canvas = document.createElement('canvas')
    canvas.setAttribute('width', this.width)
    canvas.setAttribute('height', this.height)
    this.$container.appendChild(canvas)
    this.context = canvas.getContext('2d')
    this.interval = this.ADD_INTERVAL
    this.distance = Math.sqrt(
      Math.pow(this.width / 2, 2) + Math.pow(this.height / 2, 2)
    )
    this.theta = 0
    this.mantas = []
  },
  reconstructMethod() {
    this.render = this.render.bind(this)
  },
  createMantas() {
    for (let i = 0; i < this.MANTA_COUNT; i++) {
      this.mantas.push(new MANTA(this.width, this.height, this.context))
    }
  },
  render() {
    animationFrame = requestAnimationFrame(this.render)

    const gradient = this.context.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      this.distance
    )
    const rate = 1 + 0.2 * Math.sin(this.theta)

    gradient.addColorStop(0, `hsl(195, 80%, ${60 * rate}%)`)
    gradient.addColorStop(0.2, `hsl(195, 100%, ${40 * rate}%)`)
    gradient.addColorStop(1, `hsl(220, 100%, ${5 * rate}%)`)

    this.context.fillStyle = gradient
    this.context.fillRect(0, 0, this.width, this.height)

    this.mantas.sort((manta1, manta2) => manta1.z - manta2.z)
    this.mantas.forEach(manta => manta.render(this.context))
    this.mantas = this.mantas.filter(manta => !manta.isOutside)

    if (this.interval-- == 0) {
      this.interval = this.ADD_INTERVAL
      this.mantas.push(new MANTA(this.width, this.height, this.context))
    }
    this.theta += this.DELTA_THETA
    this.theta %= Math.PI * 2
  },
}

const MANTA_COLOR = 'hsl(200, %s%, %l%)'
const MANTA_ANGLE_RANGE = { min: -Math.PI / 8, max: Math.PI / 8 }
const MANTA_INIT_SCALE = 0.3
const MANTA_RANGE_Z = { min: 0, max: 30 }
const MANTA_DELTA_ANGLE = Math.PI / 160
const MANTA_VELOCITY = 2
const MANTA_VERTICAL_THRESHOLD = 400

class MANTA {
  constructor(width, height, context) {
    this.width = width
    this.height = height
    this.init(context)
  }
  init(context) {
    this.angle = this.getRandomValue(MANTA_ANGLE_RANGE)
    this.x = this.width / 2 + (((this.width / 3) * this.angle) / Math.PI) * 8
    this.y = this.height + MANTA_VERTICAL_THRESHOLD * MANTA_INIT_SCALE
    this.z = this.getRandomValue(MANTA_RANGE_Z)
    this.vx = -MANTA_VELOCITY * Math.cos(this.angle + Math.PI / 2)
    this.vy = -MANTA_VELOCITY * Math.sin(this.angle + Math.PI / 2)
    this.phi = Math.PI * 2 * Math.random()
    this.theta = Math.PI * 2 * Math.random()
    this.psi = Math.PI * 2 * Math.random()

    const color = MANTA_COLOR.replace('%s', 60)
    const luminance = ((20 * this.z) / MANTA_RANGE_Z.max) | 0

    this.gradient = context.createLinearGradient(-140, 0, 140, 0)
    this.gradient.addColorStop(0, color.replace('%l', 10 + luminance))
    this.gradient.addColorStop(0.1, color.replace('%l', 10 + luminance))
    this.gradient.addColorStop(0.5, color.replace('%l', 20 + luminance))
    this.gradient.addColorStop(0.9, color.replace('%l', 10 + luminance))
    this.gradient.addColorStop(1, color.replace('%l', 10 + luminance))
    this.color = MANTA_COLOR.replace('%s', 100).replace('%l', 5 + luminance)
  }
  getRandomValue(range) {
    return range.min + (range.max - range.min) * Math.random()
  }
  render(context) {
    const height = this.height + MANTA_VERTICAL_THRESHOLD
    const scale =
      MANTA_INIT_SCALE +
      (((((1 - MANTA_INIT_SCALE) * (height - this.y)) / height) *
        (MANTA_RANGE_Z.max - this.z)) /
        MANTA_RANGE_Z.max) *
        2
    const top = (Math.sin(this.phi) < 0 ? 50 : 60) * Math.sin(this.phi)

    context.save()
    context.translate(this.x, this.y)
    context.scale(scale, scale)
    context.rotate(this.angle)

    context.fillStyle = this.color
    context.beginPath()
    context.moveTo((225 + top) / 4, -20)
    context.lineTo((210 + top) / 4, 70 / 4)
    context.lineTo(-(210 + top) / 4, 70 / 4)
    context.lineTo(-(225 + top) / 4, -20)
    context.closePath()
    context.fill()

    context.lineWidth = 5
    context.strokeStyle = this.gradient
    context.beginPath()
    context.moveTo(0, 70)
    context.quadraticCurveTo(0, 130, 20 * Math.sin(this.theta), 190)
    context.stroke()

    context.fillStyle = this.gradient
    context.beginPath()
    context.moveTo(-15, -40)
    context.bezierCurveTo(-10, -35, 10, -35, 15, -40)
    context.lineTo(30, -40)
    context.quadraticCurveTo(35, -40, 45, -30)
    context.quadraticCurveTo(50, -25, 80 + top, 0)
    context.quadraticCurveTo(60, 0, 10, 70)
    context.lineTo(-10, 70)
    context.quadraticCurveTo(-60, 0, -80 - top, 0)
    context.quadraticCurveTo(-50, -25, -45, -30)
    context.quadraticCurveTo(-35, -40, -30, -40)
    context.lineTo(-15, -40)
    context.closePath()
    context.fill()

    context.lineWidth = 12
    context.strokeStyle = this.gradient
    context.beginPath()
    context.moveTo(23, -38)
    context.quadraticCurveTo(33, -55, 23 - 10 * Math.sin(this.psi), -70)
    context.stroke()

    context.beginPath()
    context.moveTo(-23, -38)
    context.quadraticCurveTo(-33, -55, -23 + 10 * Math.sin(this.psi), -70)
    context.stroke()

    context.lineWidth = 1
    context.strokeStyle = this.color
    context.beginPath()

    for (let i = 0; i < 5; i++) {
      const y = -10 + i * 8 + (1 - Math.sin(this.phi)) * 3
      context.moveTo(10, -20 + i * 8)
      context.quadraticCurveTo(20, -15 + i * 8, 30, y)
      context.moveTo(-10, -20 + i * 8)
      context.quadraticCurveTo(-20, -15 + i * 8, -30, y)
    }
    context.stroke()
    context.restore()

    this.x += this.vx * scale
    this.y += this.vy * scale
    this.phi += MANTA_DELTA_ANGLE
    this.phi %= Math.PI * 2
    this.theta += MANTA_DELTA_ANGLE
    this.theta %= Math.PI * 2
    this.psi += MANTA_DELTA_ANGLE
    this.psi %= Math.PI * 2
    this.isOutside = this.y < -MANTA_VERTICAL_THRESHOLD
  }
}

window.addEventListener('load', () => MANTA_RENDERER.init())

window.addEventListener('resize', () => {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  MANTA_RENDERER.destroy()
  MANTA_RENDERER.init()
})
