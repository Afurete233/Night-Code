export const name = '@local/dsh-music-production'
export const inject = ['tools']

const DEFAULT_CONFIG = {
  projectUrl: 'http://127.0.0.1:5173',
  timeoutMs: 10000,
}

const outputSchema = {
  type: 'object',
  properties: {
    accepted: { type: 'boolean' },
    id: { type: 'string' },
    projectUrl: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['accepted', 'id', 'projectUrl', 'message'],
  additionalProperties: false,
}

export function apply(ctx, config = DEFAULT_CONFIG) {
  const endpoint = `${String(config.projectUrl || DEFAULT_CONFIG.projectUrl).replace(/\/$/, '')}/api/dsh/production-brief`

  ctx.tools.register({
    name: 'music_production_brief',
    description: 'Send a complete music-video production brief to the connected Frameflow editor. Use after collecting the requirements, lyrics, audio URL/path, image URLs/paths, visual style, dimensions, and timing. The editor immediately imports timed lyrics and assets with exact width/height and retains the brief for asset generation and project assembly.',
    parameters: {
      type: 'object',
      properties: {
        requirement: { type: 'string', description: 'Creative and technical production requirements.' },
        lyrics: { type: 'string', description: 'Lyrics, optionally with LRC timestamps.' },
        audioUrl: { type: 'string', description: 'Audio URL reachable by the editor, if available.' },
        imageUrls: { type: 'array', items: { type: 'string' }, description: 'Image URLs reachable by the editor, if available.' },
        assets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              name: { type: 'string' },
              kind: { type: 'string', enum: ['image', 'audio', 'shape', 'background'] },
              width: { type: 'number' },
              height: { type: 'number' },
              naturalWidth: { type: 'number' },
              naturalHeight: { type: 'number' },
              x: { type: 'number' },
              y: { type: 'number' },
              scale: { type: 'number' },
              opacity: { type: 'number' },
              rotation: { type: 'number' },
              start: { type: 'number' },
              duration: { type: 'number' },
            },
            required: ['url'],
          },
          description: 'Structured asset specifications with width, height, position, and transform properties.',
        },
        dimensions: {
          type: 'object',
          properties: {
            width: { type: 'number', description: 'Canvas width (e.g. 1920)' },
            height: { type: 'number', description: 'Canvas height (e.g. 1080)' },
          },
          description: 'Target video dimensions/resolution.',
        },
        style: { type: 'string', description: 'Visual style, mood, color, typography, and motion direction.' },
        duration: { type: 'number', description: 'Target duration in seconds.' },
        project: { type: 'object', description: 'Optional complete editor project JSON to import directly (supports layer-level width, height, naturalWidth, naturalHeight).' },
      },
      required: ['requirement'],
      additionalProperties: false,
    },
    output: {
      schema: outputSchema,
      render: (_args, result) => [{ type: 'text', text: result.message }],
    },
    async execute(args, exec) {
      const id = `music-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const brief = {
        id,
        requirement: String(args.requirement || '').trim(),
        lyrics: typeof args.lyrics === 'string' ? args.lyrics : '',
        audioUrl: typeof args.audioUrl === 'string' ? args.audioUrl : '',
        imageUrls: Array.isArray(args.imageUrls) ? args.imageUrls.map(String) : [],
        assets: Array.isArray(args.assets) ? args.assets : undefined,
        dimensions: args.dimensions && typeof args.dimensions === 'object' ? args.dimensions : undefined,
        style: typeof args.style === 'string' ? args.style : '',
        duration: typeof args.duration === 'number' ? args.duration : undefined,
        project: args.project && typeof args.project === 'object' ? args.project : undefined,
        source: 'dsh',
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(brief),
        signal: exec.signal,
      })
      if (!response.ok) throw new Error(`Frameflow bridge rejected the brief (${response.status})`)
      return {
        accepted: true,
        id,
        projectUrl: String(config.projectUrl),
        message: `Production brief ${id} was delivered to Frameflow. Timed lyrics will be imported when the editor receives it.`,
      }
    },
    presentCall: args => ({
      card: 'generic',
      title: `Send production brief to Frameflow${args.style ? ` · ${args.style}` : ''}`,
      kind: 'production',
      rawInput: args,
    }),
  })
}
