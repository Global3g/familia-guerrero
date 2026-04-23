/**
 * Golden cross (†) shown next to deceased family members' names.
 * Usage: <DeceasedCross deathDate={person.deathDate} />
 * Only renders if deathDate is truthy.
 */
export default function DeceasedCross({ deathDate }) {
  if (!deathDate) return null
  return <span className="ml-1 text-lg font-bold" style={{ color: '#D4A843' }}>✝</span>
}
