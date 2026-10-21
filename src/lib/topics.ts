import type { Topic } from '../types'

/** The three federal areas, in the order the exam catalogue presents them. */
export const FEDERAL_TOPICS: Topic[] = [
  'Politik in der Demokratie',
  'Geschichte und Verantwortung',
  'Mensch und Gesellschaft',
]

interface TopicMeta {
  /** Short name for chips, tabs and the question header. */
  short: string
  /** URL-safe key, used in `#/review?topic=`. */
  slug: string
  /** Sets the --topic* custom properties defined in styles.css. */
  className: string
}

const TOPIC_META: Record<Topic, TopicMeta> = {
  'Politik in der Demokratie': { short: 'Politik', slug: 'politik', className: 'topic-politik' },
  'Geschichte und Verantwortung': { short: 'Geschichte', slug: 'geschichte', className: 'topic-geschichte' },
  'Mensch und Gesellschaft': { short: 'Gesellschaft', slug: 'gesellschaft', className: 'topic-gesellschaft' },
  'Bundesland Berlin': { short: 'Berlin', slug: 'berlin', className: 'topic-berlin' },
}

/**
 * Looks a topic up without trusting the data: question files are generated,
 * and a label outside the four known topics falls back to Politik's styling
 * rather than rendering an unstyled header.
 */
export function topicMeta(topic: string): TopicMeta {
  return TOPIC_META[topic as Topic] ?? TOPIC_META['Politik in der Demokratie']
}

export function topicFromSlug(slug: string | null): Topic | null {
  if (!slug) return null
  const match = (Object.keys(TOPIC_META) as Topic[]).find((t) => TOPIC_META[t].slug === slug)
  return match ?? null
}
