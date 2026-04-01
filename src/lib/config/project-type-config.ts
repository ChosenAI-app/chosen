export interface ProjectTypeConfig {
  showAduSqft: boolean
  showSprinklers: boolean
  showEarthwork: boolean
  showSeparatelyMetered: boolean
  step2Title: string
  step2Subtitle: string
}

export const PROJECT_TYPE_CONFIGS: Record<string, ProjectTypeConfig> = {
  adu_detached: {
    showAduSqft: true,
    showSprinklers: true,
    showEarthwork: true,
    showSeparatelyMetered: true,
    step2Title: "A few details about your ADU",
    step2Subtitle: "These determine which permits your project requires.",
  },
  adu_attached: {
    showAduSqft: true,
    showSprinklers: true,
    showEarthwork: false,
    showSeparatelyMetered: true,
    step2Title: "A few details about your ADU",
    step2Subtitle: "These determine which permits your project requires.",
  },
  jadu: {
    showAduSqft: true,
    showSprinklers: true,
    showEarthwork: false,
    showSeparatelyMetered: false,
    step2Title: "A few details about your JADU",
    step2Subtitle: "These determine which permits your project requires.",
  },
  addition: {
    showAduSqft: false,
    showSprinklers: true,
    showEarthwork: true,
    showSeparatelyMetered: false,
    step2Title: "A couple of questions",
    step2Subtitle:
      "These help us identify the right permits for your addition.",
  },
  remodel: {
    showAduSqft: false,
    showSprinklers: false,
    showEarthwork: false,
    showSeparatelyMetered: false,
    step2Title: "Ready to go",
    step2Subtitle:
      "We have everything we need to generate your permit scope.",
  },
  new_construction: {
    showAduSqft: false,
    showSprinklers: true,
    showEarthwork: true,
    showSeparatelyMetered: false,
    step2Title: "A few details about your new build",
    step2Subtitle: "These determine which permits and reviews apply.",
  },
  conversion: {
    showAduSqft: true,
    showSprinklers: true,
    showEarthwork: false,
    showSeparatelyMetered: true,
    step2Title: "A few details about your conversion",
    step2Subtitle: "These determine which permits your project requires.",
  },
}

export const DEFAULT_CONFIG: ProjectTypeConfig = {
  showAduSqft: false,
  showSprinklers: true,
  showEarthwork: false,
  showSeparatelyMetered: false,
  step2Title: "A couple of questions",
  step2Subtitle: "These help us identify the right permits.",
}

export function getProjectTypeConfig(
  projectType: string
): ProjectTypeConfig {
  return PROJECT_TYPE_CONFIGS[projectType] ?? DEFAULT_CONFIG
}

export function hasAnyQuestions(config: ProjectTypeConfig): boolean {
  return (
    config.showAduSqft ||
    config.showSprinklers ||
    config.showEarthwork ||
    config.showSeparatelyMetered
  )
}
