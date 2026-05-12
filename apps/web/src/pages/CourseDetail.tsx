import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  useCourse,
  useDeleteCourse,
  useFavoriteCourse,
} from '@/api/courses'
import { useCreateTeeTime } from '@/api/courses'
import { Panel, Stat, Tag } from '@/components/ui'
import { CourseEditor } from '@/components/courses/CourseEditor'

export default function CourseDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: course, isLoading } = useCourse(id)
  const deleteCourse = useDeleteCourse()
  const favorite = useFavoriteCourse()
  const createTeeTime = useCreateTeeTime()

  const [editorOpen, setEditorOpen] = useState(false)

  if (isLoading)
    return <div className="mono text-[11px] text-ink-3">LOADING COURSE…</div>
  if (!course)
    return (
      <div className="mono text-[11px] text-ink-3">
        Course not found.{' '}
        <Link to="/courses" className="text-accent-fg hover:underline">
          Back to library →
        </Link>
      </div>
    )

  const editable = !course.is_verified

  const handleDelete = async () => {
    if (!window.confirm('Delete this course? This cannot be undone.')) return
    await deleteCourse.mutateAsync(course.id)
    navigate('/courses')
  }

  const handlePlanRound = async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    await createTeeTime.mutateAsync({
      course_id: course.id,
      tee_time: tomorrow.toISOString(),
    })
    navigate('/calendar')
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-line-strong pb-6">
        <div className="micro mb-3">
          <Link to="/courses" className="hover:text-accent-fg">
            PLAY › COURSES
          </Link>
          {' › '}
          {course.country?.toUpperCase() || '—'}
        </div>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="display text-[56px] m-0">{course.name}</h1>
            <div className="mono text-[12px] text-ink-3 mt-3 uppercase tracking-micro-tight">
              {[course.city, course.country].filter(Boolean).join(', ') || '—'}
              {course.course_type ? ` · ${course.course_type}` : ''}
              {course.designer ? ` · DESIGNER ${course.designer}` : ''}
              {course.established ? ` · EST ${course.established}` : ''}
            </div>
            <div className="flex gap-2 mt-3">
              {course.is_verified && <Tag tone="accent">VERIFIED CATALOG</Tag>}
              {course.par != null && <Tag>PAR {course.par}</Tag>}
              {course.slope_rating != null && <Tag>SLOPE {course.slope_rating}</Tag>}
              {course.course_rating != null && (
                <Tag>CR {course.course_rating.toFixed(1)}</Tag>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handlePlanRound}
              disabled={createTeeTime.isPending}
              className="bg-accent text-accent-ink px-5 py-3 mono text-[11px] uppercase tracking-micro hover:bg-accent-2 disabled:opacity-50"
            >
              {createTeeTime.isPending ? 'PLANNING…' : 'PLAN ROUND →'}
            </button>
            <button
              onClick={() => favorite.mutate({ id: course.id, on: true })}
              className="bg-transparent text-ink border border-line-strong px-4 py-3 mono text-[11px] uppercase tracking-micro hover:border-accent-fg hover:text-accent-fg"
            >
              ☆ FAVORITE
            </button>
            {editable && (
              <>
                <button
                  onClick={() => setEditorOpen(true)}
                  className="bg-transparent text-ink-2 border border-line-strong px-4 py-3 mono text-[11px] uppercase tracking-micro hover:border-ink-3"
                >
                  EDIT
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-transparent text-bad border border-line-strong px-4 py-3 mono text-[11px] uppercase tracking-micro hover:border-bad"
                >
                  DELETE
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Panel id="C 01" title="PAR">
          <Stat label="TOTAL" value={course.par ?? '—'} />
        </Panel>
        <Panel id="C 02" title="SLOPE">
          <Stat label="RATING" value={course.slope_rating ?? '—'} />
        </Panel>
        <Panel id="C 03" title="COURSE RATING">
          <Stat
            label="RATING"
            value={course.course_rating != null ? course.course_rating.toFixed(1) : '—'}
          />
        </Panel>
        <Panel id="C 04" title="LENGTH">
          <Stat
            label={course.total_yards ? 'YARDS' : 'METERS'}
            value={course.total_yards ?? course.total_meters ?? '—'}
            unit={course.total_yards ? 'YDS' : course.total_meters ? 'M' : ''}
          />
        </Panel>
      </div>

      <Panel id="HOLES" title="HOLE-BY-HOLE">
        {course.holes && course.holes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line-strong">
                  {['HOLE', 'PAR', 'HCP', 'YARDS'].map((h) => (
                    <th
                      key={h}
                      className="mono text-[9px] text-ink-3 tracking-micro-tight text-left py-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {course.holes.map((hole) => (
                  <tr key={hole.number} className="border-b border-line">
                    <td className="mono text-[11px] text-ink-2 py-2">
                      {String(hole.number).padStart(2, '0')}
                    </td>
                    <td className="num text-[13px] py-2">{hole.par ?? '—'}</td>
                    <td className="mono text-[11px] text-ink-3 py-2">
                      {hole.handicap ?? '—'}
                    </td>
                    <td className="num text-[13px] py-2">
                      {hole.yards ?? hole.meters ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-body text-ink-3">
            No hole-by-hole data yet.{' '}
            {editable && (
              <button
                onClick={() => setEditorOpen(true)}
                className="mono text-[10px] text-accent-fg uppercase tracking-micro hover:underline"
              >
                ADD LAYOUT →
              </button>
            )}
          </p>
        )}
      </Panel>

      {(course.website || course.phone) && (
        <Panel id="META" title="CONTACT">
          <div className="grid grid-cols-2 gap-3">
            {course.website && (
              <div>
                <div className="micro">WEBSITE</div>
                <a
                  href={course.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[14px] text-accent-fg hover:underline mt-1 inline-block"
                >
                  {course.website}
                </a>
              </div>
            )}
            {course.phone && (
              <div>
                <div className="micro">PHONE</div>
                <div className="mono text-[13px] text-ink mt-1">{course.phone}</div>
              </div>
            )}
          </div>
        </Panel>
      )}

      <CourseEditor
        open={editorOpen}
        course={course}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  )
}
