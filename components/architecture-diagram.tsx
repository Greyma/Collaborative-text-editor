"use client"

export default function ArchitectureDiagram() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 overflow-x-auto">
      <svg viewBox="0 0 800 400" className="w-full min-w-max">
        {/* Server */}
        <rect
          x="300"
          y="20"
          width="200"
          height="80"
          fill="oklch(0.45 0.2 260 / 0.1)"
          stroke="currentColor"
          strokeWidth="2"
          rx="8"
        />
        <text x="400" y="55" textAnchor="middle" className="text-base font-bold fill-foreground">
          Central Server
        </text>
        <text x="400" y="75" textAnchor="middle" className="text-sm fill-muted-foreground">
          Document State + OT Engine
        </text>

        {/* Clients */}
        <g>
          {/* Client A */}
          <rect
            x="50"
            y="200"
            width="150"
            height="120"
            fill="oklch(0.7 0.18 160 / 0.1)"
            stroke="currentColor"
            strokeWidth="2"
            rx="8"
          />
          <text x="125" y="230" textAnchor="middle" className="text-sm font-bold fill-foreground">
            Client A (User)
          </text>
          <text x="125" y="255" textAnchor="middle" className="text-xs fill-muted-foreground">
            Local State
          </text>
          <text x="125" y="275" textAnchor="middle" className="text-xs fill-muted-foreground">
            Operation Buffer
          </text>
          <text x="125" y="295" textAnchor="middle" className="text-xs fill-muted-foreground">
            Cursor Tracking
          </text>

          {/* Client B */}
          <rect
            x="600"
            y="200"
            width="150"
            height="120"
            fill="oklch(0.45 0.2 260 / 0.1)"
            stroke="currentColor"
            strokeWidth="2"
            rx="8"
          />
          <text x="675" y="230" textAnchor="middle" className="text-sm font-bold fill-foreground">
            Client B (User)
          </text>
          <text x="675" y="255" textAnchor="middle" className="text-xs fill-muted-foreground">
            Local State
          </text>
          <text x="675" y="275" textAnchor="middle" className="text-xs fill-muted-foreground">
            Operation Buffer
          </text>
          <text x="675" y="295" textAnchor="middle" className="text-xs fill-muted-foreground">
            Cursor Tracking
          </text>

          {/* Client C */}
          <rect
            x="325"
            y="320"
            width="150"
            height="120"
            fill="oklch(0.65 0.15 180 / 0.1)"
            stroke="currentColor"
            strokeWidth="2"
            rx="8"
          />
          <text x="400" y="350" textAnchor="middle" className="text-sm font-bold fill-foreground">
            Client C (User)
          </text>
          <text x="400" y="375" textAnchor="middle" className="text-xs fill-muted-foreground">
            Local State
          </text>
          <text x="400" y="395" textAnchor="middle" className="text-xs fill-muted-foreground">
            Operation Buffer
          </text>
        </g>

        {/* Connections */}
        <line
          x1="125"
          y1="320"
          x2="350"
          y2="100"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="stroke-accent"
        />
        <line
          x1="675"
          y1="320"
          x2="450"
          y2="100"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="stroke-secondary"
        />
        <line
          x1="400"
          y1="320"
          x2="400"
          y2="100"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="stroke-primary"
        />

        {/* Labels */}
        <text x="220" y="200" className="text-xs fill-accent font-semibold">
          WebSocket
        </text>
        <text x="530" y="200" className="text-xs fill-secondary font-semibold">
          WebSocket
        </text>
        <text x="360" y="220" className="text-xs fill-primary font-semibold">
          WebSocket
        </text>
      </svg>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-sm">
          <p className="font-semibold text-foreground mb-1">Client → Server</p>
          <p className="text-muted-foreground text-xs">Operations, cursor positions, typing status</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-foreground mb-1">Server Processing</p>
          <p className="text-muted-foreground text-xs">Transform, sequence, resolve conflicts</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-foreground mb-1">Server → Clients</p>
          <p className="text-muted-foreground text-xs">Transformed operations, cursor updates</p>
        </div>
      </div>
    </div>
  )
}
