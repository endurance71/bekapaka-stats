import React from 'react'

export interface ScheduleItem {
  time: string
  description: string
  isHighlight?: boolean
}

interface ScheduleTimelineProps {
  items: ScheduleItem[]
  title?: string
}

export function ScheduleTimeline({ items, title }: ScheduleTimelineProps) {
  if (!items || items.length === 0) return null

  return (
    <section className='schedule-timeline' aria-label={title || 'Harmonogram godzinowy'}>
      {title ? <h3 className='schedule-timeline__title'>{title}</h3> : null}
      <ol className='schedule-timeline__list zebra-list'>
        {items.map((item, idx) => {
          const isHighlight =
            item.isHighlight ||
            /finał|otwarcie|rozdanie nagród|dekoracja/i.test(item.description)

          return (
            <li
              key={idx}
              className={`schedule-timeline__item ${isHighlight ? 'schedule-timeline__item--highlight' : ''}`}
            >
              <div className='schedule-timeline__marker' aria-hidden='true'>
                <span className='schedule-timeline__dot' />
                {idx < items.length - 1 ? <span className='schedule-timeline__line' /> : null}
              </div>
              <div className='schedule-timeline__time-box'>
                <time className='schedule-timeline__time'>{item.time}</time>
              </div>
              <div className='schedule-timeline__content'>
                <p className='schedule-timeline__desc'>{item.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
