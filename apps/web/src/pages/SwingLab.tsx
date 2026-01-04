import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'

export default function SwingLab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-ice-white">
            {t('swingLab.title')}
          </h1>
          <p className="text-muted mt-1">
            Upload and analyze your swing videos
          </p>
        </div>
        <Button>{t('swingLab.upload')}</Button>
      </div>

      {/* Upload Area */}
      <Card className="border-dashed border-2 border-border hover:border-cyan/30 transition-colors">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-ice-white font-medium mb-2">
            Drop your swing video here
          </p>
          <p className="text-sm text-muted mb-4">
            Supports MP4, MOV • Face-on or Down-the-Line views
          </p>
          <Button variant="secondary">Select File</Button>
        </CardContent>
      </Card>

      {/* View Type Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card variant="hover" className="cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-32 mx-auto mb-4 rounded-button bg-surface border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-ice-white">{t('swingLab.faceOn')}</h3>
            <p className="text-sm text-muted mt-1">Camera facing you</p>
          </CardContent>
        </Card>
        <Card variant="hover" className="cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-32 mx-auto mb-4 rounded-button bg-surface border border-border flex items-center justify-center">
              <svg className="w-8 h-8 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-ice-white">{t('swingLab.dtl')}</h3>
            <p className="text-sm text-muted mt-1">Camera behind target line</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card className="text-center py-12">
        <p className="text-muted text-lg">{t('swingLab.noVideos')}</p>
        <p className="text-sm text-muted mt-2">
          Upload your first swing video to get AI-powered analysis
        </p>
      </Card>

      {/* Feature Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-button bg-graphite">
              <Badge variant="cyan" size="sm" className="mb-2">AI Analysis</Badge>
              <p className="text-sm text-muted">
                Automatic key frame extraction and pose analysis
              </p>
            </div>
            <div className="p-4 rounded-button bg-graphite">
              <Badge variant="cyan" size="sm" className="mb-2">Compare</Badge>
              <p className="text-sm text-muted">
                Side-by-side comparison with previous swings
              </p>
            </div>
            <div className="p-4 rounded-button bg-graphite">
              <Badge variant="cyan" size="sm" className="mb-2">Drill Match</Badge>
              <p className="text-sm text-muted">
                Auto-suggested drills based on swing faults
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
