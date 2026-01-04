import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui'
import { useTeeTimes, useCreateTeeTime, useDeleteTeeTime, TeeTime } from '@/api/courses'
import { ALL_COURSES, GolfCourse, searchCourses, NORWEGIAN_COURSES, INTERNATIONAL_COURSES } from '@/lib/golfCourses'

// Focus area options
const FOCUS_AREAS = [
  'tempo', 'face control', 'course management', 'putting', 'short game',
  'driving', 'iron play', 'mental game', 'green reading', 'bunker play'
]

export default function Calendar() {
  const { t } = useTranslation()
  const [showAddForm, setShowAddForm] = useState(false)
  const [courseSearch, setCourseSearch] = useState('')
  const [showCourseDropdown, setShowCourseDropdown] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Form state
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null)
  const [customCourseName, setCustomCourseName] = useState('')
  const [teeTimeDate, setTeeTimeDate] = useState('')
  const [teeTimeTime, setTeeTimeTime] = useState('')
  const [players, setPlayers] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([])

  // API hooks
  const { data: teeTimes, isLoading } = useTeeTimes(false) // Get all tee times including past
  const createTeeTime = useCreateTeeTime()
  const deleteTeeTime = useDeleteTeeTime()

  // Search courses
  const filteredCourses = useMemo(() => {
    if (!courseSearch) return []
    return searchCourses(courseSearch).slice(0, 8)
  }, [courseSearch])

  // Get dates with tee times for calendar highlighting
  const teeTimeDates = useMemo(() => {
    if (!teeTimes) return new Set<string>()
    return new Set(teeTimes.map(tt => {
      const date = new Date(tt.tee_time)
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    }))
  }, [teeTimes])

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isDateWithTeeTime = (day: number) => {
    const key = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}`
    return teeTimeDates.has(key)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
  }

  const handleSelectCourse = (course: GolfCourse) => {
    setSelectedCourse(course)
    setCourseSearch(course.name)
    setShowCourseDropdown(false)
    setCustomCourseName('')
  }

  const handleCourseSearchChange = (value: string) => {
    setCourseSearch(value)
    setShowCourseDropdown(value.length > 0)
    if (selectedCourse && value !== selectedCourse.name) {
      setSelectedCourse(null)
      setCustomCourseName(value)
    } else {
      setCustomCourseName(value)
    }
  }

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    )
  }

  const handleSubmit = async () => {
    if (!teeTimeDate || !teeTimeTime) return

    const dateTime = new Date(`${teeTimeDate}T${teeTimeTime}:00`)
    
    const data = {
      tee_time: dateTime.toISOString(),
      players: players.split(',').map(p => p.trim()).filter(Boolean),
      notes: notes || undefined,
      focus_areas: selectedFocusAreas.length > 0 ? selectedFocusAreas : undefined,
    }

    try {
      await createTeeTime.mutateAsync(data)
      // Reset form
      setShowAddForm(false)
      setSelectedCourse(null)
      setCourseSearch('')
      setCustomCourseName('')
      setTeeTimeDate('')
      setTeeTimeTime('')
      setPlayers('')
      setNotes('')
      setSelectedFocusAreas([])
    } catch (error) {
      console.error('Failed to create tee time:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this tee time?')) {
      try {
        await deleteTeeTime.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete tee time:', error)
      }
    }
  }

  const formatTeeTimeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTeeTimeHour = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  // Upcoming tee times (filter from all)
  const upcomingTeeTimes = useMemo(() => {
    if (!teeTimes) return []
    const now = new Date()
    return teeTimes.filter(tt => new Date(tt.tee_time) >= now)
  }, [teeTimes])

  // Past tee times
  const pastTeeTimes = useMemo(() => {
    if (!teeTimes) return []
    const now = new Date()
    return teeTimes.filter(tt => new Date(tt.tee_time) < now)
  }, [teeTimes])

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-ice-white">
            {t('calendar.title')}
          </h1>
          <p className="text-muted mt-1">
            {t('calendar.subtitle', 'Upcoming tee times and rounds')}
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('calendar.addTeeTime')}
        </Button>
      </div>

      {/* Add Tee Time Form */}
      {showAddForm && (
        <Card className="border-cyan/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('calendar.addTeeTime')}
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-4 space-y-4">
            {/* Course Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-ice-white mb-2">
                {t('calendar.course')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => handleCourseSearchChange(e.target.value)}
                  onFocus={() => setShowCourseDropdown(courseSearch.length > 0)}
                  placeholder={t('calendar.searchCourse', 'Search for a course...')}
                  className="w-full px-4 py-2.5 bg-surface border border-graphite rounded-button text-ice-white placeholder:text-muted focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30"
                />
                {selectedCourse && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs px-2 py-1 bg-cyan/20 text-cyan rounded-full">
                      {selectedCourse.country}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Course Dropdown */}
              {showCourseDropdown && filteredCourses.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-surface border border-graphite rounded-card shadow-xl max-h-64 overflow-y-auto">
                  {filteredCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => handleSelectCourse(course)}
                      className="w-full px-4 py-3 text-left hover:bg-cyan/10 border-b border-graphite/50 last:border-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-ice-white">{course.name}</div>
                          <div className="text-sm text-muted">
                            {course.city}, {course.country}
                          </div>
                        </div>
                        <div className="text-xs text-muted">
                          Par {course.par} • {course.holes} holes
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ice-white mb-2">Date</label>
                <input
                  type="date"
                  value={teeTimeDate}
                  onChange={(e) => setTeeTimeDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-graphite rounded-button text-ice-white focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ice-white mb-2">{t('calendar.time')}</label>
                <input
                  type="time"
                  value={teeTimeTime}
                  onChange={(e) => setTeeTimeTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface border border-graphite rounded-button text-ice-white focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30"
                />
              </div>
            </div>

            {/* Players */}
            <div>
              <label className="block text-sm font-medium text-ice-white mb-2">{t('calendar.players')}</label>
              <input
                type="text"
                value={players}
                onChange={(e) => setPlayers(e.target.value)}
                placeholder={t('calendar.playersPlaceholder', 'Player names (comma separated)')}
                className="w-full px-4 py-2.5 bg-surface border border-graphite rounded-button text-ice-white placeholder:text-muted focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30"
              />
            </div>

            {/* Focus Areas */}
            <div>
              <label className="block text-sm font-medium text-ice-white mb-2">
                {t('calendar.focusAreas', 'Pre-round focus areas')}
              </label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleFocusArea(area)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      selectedFocusAreas.includes(area)
                        ? 'bg-cyan text-obsidian font-medium'
                        : 'bg-surface border border-graphite text-muted hover:border-cyan/50 hover:text-ice-white'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-ice-white mb-2">{t('calendar.prepNotes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('calendar.notesPlaceholder', 'Pre-round notes or reminders...')}
                rows={3}
                className="w-full px-4 py-2.5 bg-surface border border-graphite rounded-button text-ice-white placeholder:text-muted focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <Button variant="secondary" onClick={() => setShowAddForm(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!teeTimeDate || !teeTimeTime || createTeeTime.isPending}
                className="flex-1"
              >
                {createTeeTime.isPending ? 'Saving...' : t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tee Times List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-muted">Loading tee times...</p>
                </div>
              </CardContent>
            </Card>
          ) : upcomingTeeTimes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-cyan/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-ice-white">No upcoming tee times</h3>
                    <p className="text-muted mt-1">Add your first tee time to start tracking your rounds</p>
                  </div>
                  <Button onClick={() => setShowAddForm(true)}>
                    Add Tee Time
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-lg font-medium text-ice-white flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upcoming ({upcomingTeeTimes.length})
              </h2>
              {upcomingTeeTimes.map((teeTime) => (
                <TeeTimeCard 
                  key={teeTime.id} 
                  teeTime={teeTime} 
                  onDelete={handleDelete}
                  formatDate={formatTeeTimeDate}
                  formatTime={formatTeeTimeHour}
                />
              ))}
            </>
          )}

          {/* Past Tee Times */}
          {pastTeeTimes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-muted flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Past rounds ({pastTeeTimes.length})
              </h2>
              {pastTeeTimes.slice(0, 3).map((teeTime) => (
                <TeeTimeCard 
                  key={teeTime.id} 
                  teeTime={teeTime} 
                  onDelete={handleDelete}
                  formatDate={formatTeeTimeDate}
                  formatTime={formatTeeTimeHour}
                  isPast
                />
              ))}
            </div>
          )}
        </div>

        {/* Calendar View */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <button 
                  onClick={prevMonth}
                  className="p-2 hover:bg-surface rounded-button transition-colors"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <CardTitle>
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-surface rounded-button transition-colors"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="mt-4">
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-xs text-muted py-2 font-medium">
                    {day}
                  </div>
                ))}
                {/* Empty cells for days before first of month */}
                {Array.from({ length: firstDayOfMonth }, (_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                  <div
                    key={day}
                    className={`p-2 rounded-button text-sm transition-all ${
                      isDateWithTeeTime(day)
                        ? 'bg-cyan text-obsidian font-bold'
                        : isToday(day)
                        ? 'bg-surface ring-2 ring-cyan text-ice-white font-medium'
                        : 'text-muted hover:bg-surface/50'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan">{upcomingTeeTimes.length}</div>
                  <div className="text-xs text-muted">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ice-white">{pastTeeTimes.length}</div>
                  <div className="text-xs text-muted">Past rounds</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Tee Time Card Component
function TeeTimeCard({ 
  teeTime, 
  onDelete, 
  formatDate, 
  formatTime,
  isPast = false 
}: { 
  teeTime: TeeTime
  onDelete: (id: string) => void
  formatDate: (date: string) => string
  formatTime: (date: string) => string
  isPast?: boolean
}) {
  // Try to find course in our local database
  const localCourse = ALL_COURSES.find(c => c.name.toLowerCase().includes(teeTime.course?.name?.toLowerCase() || ''))

  return (
    <Card variant="hover" className={isPast ? 'opacity-60' : ''}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Course Image */}
          <div className="w-24 h-full bg-gradient-to-br from-cyan/20 to-emerald-500/20 flex items-center justify-center rounded-l-card">
            <svg className="w-10 h-10 text-cyan/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </div>
          
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-ice-white">
                  {teeTime.course?.name || 'Unknown Course'}
                </h3>
                <p className="text-cyan mt-1 font-medium">
                  {formatDate(teeTime.tee_time)} • {formatTime(teeTime.tee_time)}
                </p>
                {teeTime.players && teeTime.players.length > 0 && (
                  <p className="text-sm text-muted mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    With: {teeTime.players.join(', ')}
                  </p>
                )}
                {teeTime.notes && (
                  <p className="text-sm text-muted mt-1">{teeTime.notes}</p>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {/* Focus Areas */}
                <div className="flex flex-wrap gap-1 justify-end">
                  {teeTime.focus_areas?.map((area) => (
                    <span
                      key={area}
                      className="px-2 py-0.5 text-xs rounded-full bg-cyan/10 border border-cyan/30 text-cyan"
                    >
                      {area}
                    </span>
                  ))}
                </div>
                
                {/* Delete button */}
                {!isPast && (
                  <button
                    onClick={() => onDelete(teeTime.id)}
                    className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete tee time"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
